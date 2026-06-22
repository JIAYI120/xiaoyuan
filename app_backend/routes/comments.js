const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const InteractionNotification = require('../models/InteractionNotification');
const { createInteractionNotification, deleteInteractionNotification } = require('../utils/interactionNotifications');

router.post('/:postId', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ msg: '评论内容不能为空' });
    }
    const comment = new Comment({
      user: req.user.id,
      post: req.params.postId,
      content: content.trim(),
    });
    await comment.save();
    const post = await Post.findByIdAndUpdate(req.params.postId, { $inc: { commentCount: 1 } }, { new: true }).select('user');
    if (post) {
      await createInteractionNotification({
        recipient: post.user,
        actor: req.user.id,
        type: 'comment',
        post: post._id,
        comment: comment._id,
        content: comment.content,
      });
    }
    const Profile = require('../models/Profile');
    const User = require('../models/User');
    const [profile, user] = await Promise.all([
      Profile.findOne({ user: req.user.id }),
      User.findById(req.user.id).select('name'),
    ]);
    res.json({
      ...comment.toObject(),
      nickname: profile?.nickname || user?.name || '',
      identity: profile?.identity || '学生',
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/:postId', auth, async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .sort({ createdAt: -1 })
      .limit(50);
    const post = await Post.findById(req.params.postId).select('user');
    const Profile = require('../models/Profile');
    const User = require('../models/User');
    const userIds = [...new Set(comments.map(c => c.user.toString()))];
    const [profiles, users] = await Promise.all([
      Profile.find({ user: { $in: userIds } }),
      User.find({ _id: { $in: userIds } }).select('name'),
    ]);
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.user.toString()] = p; });
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });
    const result = comments.map(c => {
      const uid = c.user.toString();
      const prof = profileMap[uid];
      const u = userMap[uid];
      return {
        ...c.toObject(),
        nickname: prof?.nickname || u?.name || '',
        identity: prof?.identity || '学生',
        canDelete: c.user.toString() === req.user.id || post?.user?.toString() === req.user.id,
      };
    });
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ msg: '评论不存在' });
    }
    const post = await Post.findById(comment.post).select('user commentCount');
    const canDelete = comment.user.toString() === req.user.id || post?.user?.toString() === req.user.id;
    if (!canDelete) {
      return res.status(403).json({ msg: '无权删除' });
    }
    await comment.deleteOne();
    if (post) {
      post.commentCount = Math.max(0, (post.commentCount || 0) - 1);
      await post.save();
    }
    if (post?.user) {
      await deleteInteractionNotification({
        recipient: post.user,
        actor: comment.user,
        type: 'comment',
        comment: comment._id,
      });
    }
    await InteractionNotification.deleteMany({ comment: comment._id });
    res.json({ msg: '已删除' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
