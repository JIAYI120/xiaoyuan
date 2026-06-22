const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const InteractionNotification = require('../models/InteractionNotification');
const Comment = require('../models/Comment');
const Post = require('../models/Post');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function getProfileMap(userIds = []) {
  if (!userIds.length) {
    return {};
  }

  const profiles = await Profile.find({ user: { $in: userIds } });
  return profiles.reduce((map, item) => {
    map[item.user.toString()] = item;
    return map;
  }, {});
}

function formatMessageTime(date) {
  const target = new Date(date);
  if (Number.isNaN(target.getTime())) {
    return '';
  }

  const now = new Date();
  const sameYear = now.getFullYear() === target.getFullYear();
  const sameDay = sameYear
    && now.getMonth() === target.getMonth()
    && now.getDate() === target.getDate();

  const hour = `${target.getHours()}`.padStart(2, '0');
  const minute = `${target.getMinutes()}`.padStart(2, '0');

  if (sameDay) {
    return `${hour}:${minute}`;
  }

  const month = `${target.getMonth() + 1}`.padStart(2, '0');
  const day = `${target.getDate()}`.padStart(2, '0');

  if (sameYear) {
    return `${month}-${day} ${hour}:${minute}`;
  }

  return `${target.getFullYear()}-${month}-${day}`;
}

function getUserDeleteCutoff(conversation, userId) {
  const snapshot = conversation.deletedSnapshots?.get?.(userId);
  if (snapshot) {
    return new Date(snapshot);
  }
  return null;
}

function getPhysicalClearBoundary(conversation) {
  const snapshotValues = Object.values(conversation.deletedSnapshots?.toObject?.() || {});
  if (!snapshotValues.length) {
    return null;
  }

  const validDates = snapshotValues
    .map(value => new Date(value))
    .filter(value => !Number.isNaN(value.getTime()));

  if (!validDates.length) {
    return null;
  }

  return new Date(Math.min(...validDates.map(item => item.getTime())));
}

async function cleanupSharedDeletedMessages(conversation) {
  const boundary = getPhysicalClearBoundary(conversation);
  if (!boundary) {
    return false;
  }

  const lastClearedAt = conversation.lastClearedAt ? new Date(conversation.lastClearedAt) : null;
  if (lastClearedAt && boundary.getTime() <= lastClearedAt.getTime()) {
    return false;
  }

  const deleteQuery = {
    conversation: conversation._id,
    createdAt: { $lte: boundary },
  };

  if (lastClearedAt) {
    deleteQuery.createdAt.$gt = lastClearedAt;
  }

  await Message.deleteMany(deleteQuery);
  conversation.lastClearedAt = boundary;

  const remainingCount = await Message.countDocuments({ conversation: conversation._id });
  if (remainingCount === 0) {
    await conversation.deleteOne();
    return true;
  }

  const latestMessage = await Message.findOne({ conversation: conversation._id }).sort({ createdAt: -1 });
  conversation.lastMessage = latestMessage?.content || '';
  conversation.lastMessageAt = latestMessage?.createdAt || conversation.updatedAt;
  await conversation.save();
  return false;
}

async function getOrCreateConversation(userA, userB) {
  const participants = [userA, userB].sort();
  let conversation = await Conversation.findOne({ participants });
  if (!conversation) {
    conversation = new Conversation({ participants });
    await conversation.save();
  }
  return conversation;
}

function getNotificationDesc(item) {
  if (item.type === 'like') return '赞了你的帖子';
  if (item.type === 'comment') return item.content ? `评论了你：${item.content}` : '评论了你的帖子';
  if (item.type === 'bookmark') return '收藏了你的帖子';
  if (item.type === 'follow') return '关注了你';
  return '与你产生了互动';
}

router.get('/conversations', auth, async (req, res) => {
  try {
    const myId = req.user.id;
    const conversations = await Conversation.find({ participants: myId }).sort({ lastMessageAt: -1 });
    const visibleConversations = conversations.filter(
      item => !(item.deletedBy || []).some(id => id.toString() === myId)
    );
    const otherUserIds = visibleConversations
      .map(item => item.participants.find(id => id.toString() !== myId)?.toString())
      .filter(Boolean);

    const [users, profileMap] = await Promise.all([
      otherUserIds.length ? User.find({ _id: { $in: otherUserIds } }).select('name') : [],
      getProfileMap(otherUserIds),
    ]);

    const userMap = users.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});

    const visibleConversationIds = visibleConversations.map(item => item._id);
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          receiver: new mongoose.Types.ObjectId(myId),
          isRead: false,
          conversation: { $in: visibleConversationIds },
        },
      },
      { $group: { _id: '$conversation', count: { $sum: 1 } } },
    ]);
    const unreadMap = unreadCounts.reduce((map, item) => {
      map[item._id.toString()] = item.count;
      return map;
    }, {});

    const result = visibleConversations.map(item => {
      const otherUserId = item.participants.find(id => id.toString() !== myId)?.toString();
      const user = userMap[otherUserId];
      const profile = profileMap[otherUserId];
      const nickname = profile?.nickname || user?.name || '校园用户';
      const isMuted = (item.mutedBy || []).some(id => id.toString() === myId);
      return {
        id: item._id,
        userId: otherUserId,
        nickname,
        avatarText: nickname.charAt(0).toUpperCase(),
        lastMessage: item.lastMessage || '开始和 Ta 聊天吧',
        time: formatMessageTime(item.lastMessageAt || item.updatedAt),
        unreadCount: unreadMap[item._id.toString()] || 0,
        isPinned: (item.pinnedBy || []).some(id => id.toString() === myId),
        isMuted,
        updatedAt: item.lastMessageAt || item.updatedAt,
      };
    });

    result.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/conversation-detail/:userId', auth, async (req, res) => {
  try {
    const myId = req.user.id;
    const otherUserId = req.params.userId;

    if (!isValidObjectId(otherUserId)) {
      return res.status(400).json({ msg: '无效的用户ID' });
    }

    const user = await User.findById(otherUserId).select('name');
    if (!user) {
      return res.status(404).json({ msg: '用户不存在' });
    }

    const [profile, conversation] = await Promise.all([
      Profile.findOne({ user: otherUserId }),
      getOrCreateConversation(myId, otherUserId),
    ]);

    const nickname = profile?.nickname || user.name || '校园用户';
    const deleteCutoff = getUserDeleteCutoff(conversation, myId);

    res.json({
      conversationId: conversation._id,
      user: {
        _id: otherUserId,
        nickname,
      },
      isPinned: (conversation.pinnedBy || []).some(id => id.toString() === myId),
      isMuted: (conversation.mutedBy || []).some(id => id.toString() === myId),
      deleteCutoff,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/history/:userId', auth, async (req, res) => {
  try {
    const myId = req.user.id;
    const otherUserId = req.params.userId;

    if (!isValidObjectId(otherUserId)) {
      return res.status(400).json({ msg: '无效的用户ID' });
    }

    const user = await User.findById(otherUserId).select('name');
    if (!user) {
      return res.status(404).json({ msg: '用户不存在' });
    }

    const [profile, conversation] = await Promise.all([
      Profile.findOne({ user: otherUserId }),
      getOrCreateConversation(myId, otherUserId),
    ]);

    const deleteCutoff = getUserDeleteCutoff(conversation, myId);
    const messageQuery = { conversation: conversation._id };
    if (deleteCutoff) {
      messageQuery.createdAt = { $gt: deleteCutoff };
    }

    const messages = await Message.find(messageQuery).sort({ createdAt: 1 });

    await Message.updateMany(
      { conversation: conversation._id, receiver: myId, isRead: false, ...(deleteCutoff ? { createdAt: { $gt: deleteCutoff } } : {}) },
      { $set: { isRead: true } }
    );

    const nickname = profile?.nickname || user.name || '校园用户';

    res.json({
      conversationId: conversation._id,
      user: {
        _id: otherUserId,
        nickname,
      },
      partner: {
        userId: otherUserId,
        nickname,
        avatarText: nickname.charAt(0).toUpperCase(),
      },
      messages: messages.map(item => ({
        _id: item._id,
        senderId: item.sender,
        receiverId: item.receiver,
        content: item.content,
        isSelf: item.sender.toString() === myId,
        createdAt: item.createdAt,
        createdAtLabel: formatMessageTime(item.createdAt),
      })),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/search/:userId', auth, async (req, res) => {
  try {
    const myId = req.user.id;
    const otherUserId = req.params.userId;
    const keyword = `${req.query.keyword || ''}`.trim();

    if (!isValidObjectId(otherUserId)) {
      return res.status(400).json({ msg: '无效的用户ID' });
    }

    if (!keyword) {
      return res.json({ list: [] });
    }

    const conversation = await getOrCreateConversation(myId, otherUserId);
    const deleteCutoff = getUserDeleteCutoff(conversation, myId);
    const query = {
      conversation: conversation._id,
      content: { $regex: keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
    };

    if (deleteCutoff) {
      query.createdAt = { $gt: deleteCutoff };
    }

    const messages = await Message.find(query).sort({ createdAt: -1 }).limit(100);
    res.json({
      list: messages.map(item => ({
        _id: item._id,
        senderId: item.sender,
        receiverId: item.receiver,
        content: item.content,
        isSelf: item.sender.toString() === myId,
        createdAt: item.createdAt,
        createdAtLabel: formatMessageTime(item.createdAt),
      })),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.patch('/conversations/:id/pin', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ msg: '会话不存在' });
    }

    const myId = req.user.id;
    if (!conversation.participants.some(id => id.toString() === myId)) {
      return res.status(403).json({ msg: '无权限操作' });
    }

    const pinnedBy = (conversation.pinnedBy || []).map(id => id.toString());
    const isPinned = pinnedBy.includes(myId);

    if (isPinned) {
      conversation.pinnedBy = conversation.pinnedBy.filter(id => id.toString() !== myId);
    } else {
      conversation.pinnedBy = [...(conversation.pinnedBy || []), myId];
    }

    await conversation.save();
    res.json({ isPinned: !isPinned });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.patch('/conversations/:id/mute', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ msg: '会话不存在' });
    }

    const myId = req.user.id;
    if (!conversation.participants.some(id => id.toString() === myId)) {
      return res.status(403).json({ msg: '无权限操作' });
    }

    const mutedBy = (conversation.mutedBy || []).map(id => id.toString());
    const isMuted = mutedBy.includes(myId);

    if (isMuted) {
      conversation.mutedBy = conversation.mutedBy.filter(id => id.toString() !== myId);
    } else {
      conversation.mutedBy = [...(conversation.mutedBy || []), myId];
    }

    await conversation.save();
    res.json({ isMuted: !isMuted });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.delete('/conversations/:id', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ msg: '会话不存在' });
    }

    const myId = req.user.id;
    if (!conversation.participants.some(id => id.toString() === myId)) {
      return res.status(403).json({ msg: '无权限操作' });
    }

    const deleteTime = new Date();
    const deletedBy = [...new Set([...(conversation.deletedBy || []).map(id => id.toString()), myId])];
    conversation.deletedBy = deletedBy;
    conversation.pinnedBy = (conversation.pinnedBy || []).filter(id => id.toString() !== myId);
    conversation.mutedBy = (conversation.mutedBy || []).filter(id => id.toString() !== myId);
    if (!conversation.deletedSnapshots) {
      conversation.deletedSnapshots = new Map();
    }
    conversation.deletedSnapshots.set(myId, deleteTime);

    const fullyDeleted = await cleanupSharedDeletedMessages(conversation);
    if (fullyDeleted) {
      return res.json({ msg: '聊天记录已彻底删除', fullyDeleted: true });
    }

    await conversation.save();
    res.json({ msg: '聊天已从当前账号隐藏', fullyDeleted: false });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/summary', auth, async (req, res) => {
  try {
    const myId = req.user.id;
    const visibleConversations = await Conversation.find({ participants: myId, deletedBy: { $ne: myId } }).select('_id mutedBy');
    const activeConversationIds = visibleConversations
      .filter(item => !(item.mutedBy || []).some(id => id.toString() === myId))
      .map(item => item._id);

    const [dmUnreadCount, interactionUnreadCount] = await Promise.all([
      Message.countDocuments({
        receiver: myId,
        isRead: false,
        conversation: { $in: activeConversationIds },
      }),
      InteractionNotification.countDocuments({ recipient: myId, isRead: false }),
    ]);

    res.json({
      dmUnreadCount,
      interactionUnreadCount,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/notifications', auth, async (req, res) => {
  try {
    const myId = req.user.id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      InteractionNotification.find({ recipient: myId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      InteractionNotification.countDocuments({ recipient: myId }),
    ]);

    const actorIds = notifications.map(item => item.actor.toString());
    const [users, profileMap] = await Promise.all([
      actorIds.length ? User.find({ _id: { $in: [...new Set(actorIds)] } }).select('name') : [],
      getProfileMap(actorIds),
    ]);

    const userMap = users.reduce((map, item) => {
      map[item._id.toString()] = item;
      return map;
    }, {});

    const notices = notifications.map(item => {
      const actorId = item.actor.toString();
      const user = userMap[actorId];
      const profile = profileMap[actorId];
      const nickname = profile?.nickname || user?.name || '校园用户';
      return {
        id: item._id,
        type: item.type,
        actorId,
        postId: item.post?.toString(),
        commentId: item.comment?.toString(),
        title: nickname,
        avatarText: nickname.charAt(0).toUpperCase(),
        desc: getNotificationDesc(item),
        time: formatMessageTime(item.createdAt),
        isRead: item.isRead,
        createdAt: item.createdAt,
      };
    });

    res.json({
      list: notices,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + notices.length < total,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.patch('/notifications/read-all', auth, async (req, res) => {
  try {
    await InteractionNotification.updateMany(
      { recipient: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ msg: '已全部标记为已读' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.delete('/notifications/:id', auth, async (req, res) => {
  try {
    const notification = await InteractionNotification.findOne({ _id: req.params.id, recipient: req.user.id });
    if (!notification) {
      return res.status(404).json({ msg: '通知不存在' });
    }

    if (notification.type === 'comment' && notification.comment) {
      const comment = await Comment.findById(notification.comment);
      if (comment) {
        const post = await Post.findById(comment.post).select('user commentCount');
        const canDeleteComment = comment.user.toString() === req.user.id || post?.user?.toString() === req.user.id;
        if (canDeleteComment) {
          await comment.deleteOne();
          if (post) {
            post.commentCount = Math.max(0, (post.commentCount || 0) - 1);
            await post.save();
          }
          await InteractionNotification.deleteMany({ comment: comment._id });
        }
      }
    }

    await notification.deleteOne();
    res.json({ msg: '已删除通知' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/:userId', auth, async (req, res) => {
  try {
    const myId = req.user.id;
    const otherUserId = req.params.userId;
    const { content } = req.body;

    if (!isValidObjectId(otherUserId)) {
      return res.status(400).json({ msg: '无效的用户ID' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ msg: '私信内容不能为空' });
    }
    if (myId === otherUserId) {
      return res.status(400).json({ msg: '不能给自己发私信' });
    }

    const user = await User.findById(otherUserId);
    if (!user) {
      return res.status(404).json({ msg: '用户不存在' });
    }

    const conversation = await getOrCreateConversation(myId, otherUserId);
    const message = new Message({
      conversation: conversation._id,
      sender: myId,
      receiver: otherUserId,
      content: content.trim(),
      isRead: false,
    });
    await message.save();

    conversation.lastMessage = message.content;
    conversation.lastMessageAt = message.createdAt;
    conversation.deletedBy = (conversation.deletedBy || []).filter(id => id.toString() !== myId && id.toString() !== otherUserId);
    await conversation.save();

    res.json({
      _id: message._id,
      senderId: message.sender,
      receiverId: message.receiver,
      content: message.content,
      isSelf: true,
      createdAt: message.createdAt,
      createdAtLabel: formatMessageTime(message.createdAt),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
