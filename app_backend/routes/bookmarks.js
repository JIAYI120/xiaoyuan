const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/auth');
const Bookmark = require('../models/Bookmark');
const Post = require('../models/Post');
const Profile = require('../models/Profile');
const User = require('../models/User');
const { createInteractionNotification, deleteInteractionNotification } = require('../utils/interactionNotifications');

router.post('/:postId', auth, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const postId = req.params.postId;
    let createdBookmark = null;
    let postOwnerId = null;

    await session.withTransaction(async () => {
      const post = await Post.findById(postId).select('user bookmarkCount').session(session);
      if (!post) {
        throw new Error('POST_NOT_FOUND');
      }

      const existing = await Bookmark.findOne({ user: req.user.id, post: postId }).session(session);
      if (existing) {
        throw new Error('ALREADY_BOOKMARKED');
      }

      const [bookmark] = await Bookmark.create([
        { user: req.user.id, post: postId },
      ], { session });

      createdBookmark = bookmark;
      postOwnerId = post.user;

      post.bookmarkCount = await Bookmark.countDocuments({ post: postId }).session(session);
      await post.save({ session });
    });

    if (postOwnerId) {
      await createInteractionNotification({
        recipient: postOwnerId,
        actor: req.user.id,
        type: 'bookmark',
        post: postId,
      });
    }

    res.json(createdBookmark);
  } catch (err) {
    if (err.message === 'POST_NOT_FOUND') {
      res.status(404).json({ msg: '帖子不存在' });
      return;
    }

    if (err.message === 'ALREADY_BOOKMARKED') {
      res.status(400).json({ msg: '已收藏' });
      return;
    }

    if (err?.code === 11000) {
      res.status(400).json({ msg: '已收藏' });
      return;
    }

    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    await session.endSession();
  }
});

router.delete('/:postId', auth, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const postId = req.params.postId;
    let deleted = false;
    let postOwnerId = null;

    await session.withTransaction(async () => {
      const post = await Post.findById(postId).select('user bookmarkCount').session(session);
      if (!post) {
        throw new Error('POST_NOT_FOUND');
      }

      const bookmark = await Bookmark.findOneAndDelete({ user: req.user.id, post: postId }).session(session);
      if (!bookmark) {
        throw new Error('BOOKMARK_NOT_FOUND');
      }

      deleted = true;
      postOwnerId = post.user;
      post.bookmarkCount = await Bookmark.countDocuments({ post: postId }).session(session);
      await post.save({ session });
    });

    if (!deleted) {
      res.status(404).json({ msg: '未收藏' });
      return;
    }

    if (postOwnerId) {
      await deleteInteractionNotification({
        recipient: postOwnerId,
        actor: req.user.id,
        type: 'bookmark',
        post: postId,
      });
    }

    res.json({ msg: '已取消收藏' });
  } catch (err) {
    if (err.message === 'POST_NOT_FOUND') {
      res.status(404).json({ msg: '帖子不存在' });
      return;
    }

    if (err.message === 'BOOKMARK_NOT_FOUND') {
      res.status(404).json({ msg: '未收藏' });
      return;
    }

    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    await session.endSession();
  }
});

router.get('/status', auth, async (req, res) => {
  try {
    const postIds = req.query.posts;
    if (!postIds) return res.json({});
    const ids = Array.isArray(postIds) ? postIds : postIds.split(',');
    const bookmarks = await Bookmark.find({ user: req.user.id, post: { $in: ids } });
    const map = {};
    bookmarks.forEach(b => { map[b.post.toString()] = true; });
    res.json(map);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/mine', auth, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user.id }).sort({ createdAt: -1 });
    const postIds = bookmarks.map(b => b.post);
    const posts = await Post.find({ _id: { $in: postIds } }).sort({ createdAt: -1 });
    
    const userIds = [...new Set(posts.map(p => p.user.toString()))];
    const [profiles, users] = await Promise.all([
      Profile.find({ user: { $in: userIds } }),
      User.find({ _id: { $in: userIds } }).select('name'),
    ]);
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.user.toString()] = p; });
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });
    
    const result = posts.map(p => {
      const uid = p.user.toString();
      const prof = profileMap[uid];
      const u = userMap[uid];
      return {
        ...p.toObject(),
        nickname: prof?.nickname || u?.name || '',
        identity: prof?.identity || '学生',
      };
    });
    
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
