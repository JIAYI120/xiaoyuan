const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const Like = require('../models/Like');
const Post = require('../models/Post');
const Profile = require('../models/Profile');
const User = require('../models/User');
const { createInteractionNotification, deleteInteractionNotification } = require('../utils/interactionNotifications');

router.post('/:postId', auth, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const postId = req.params.postId;
    let createdLike = null;
    let postOwnerId = null;

    await session.withTransaction(async () => {
      const post = await Post.findById(postId).select('user likeCount').session(session);
      if (!post) {
        throw new Error('POST_NOT_FOUND');
      }

      const existing = await Like.findOne({ user: req.user.id, post: postId }).session(session);
      if (existing) {
        throw new Error('ALREADY_LIKED');
      }

      const [like] = await Like.create([
        { user: req.user.id, post: postId },
      ], { session });

      createdLike = like;
      postOwnerId = post.user;

      post.likeCount = await Like.countDocuments({ post: postId }).session(session);
      await post.save({ session });
    });

    if (postOwnerId) {
      await createInteractionNotification({
        recipient: postOwnerId,
        actor: req.user.id,
        type: 'like',
        post: postId,
      });
    }

    res.json(createdLike);
  } catch (err) {
    if (err.message === 'POST_NOT_FOUND') {
      res.status(404).json({ msg: '帖子不存在' });
      return;
    }

    if (err.message === 'ALREADY_LIKED') {
      res.status(400).json({ msg: '已点赞' });
      return;
    }

    if (err?.code === 11000) {
      res.status(400).json({ msg: '已点赞' });
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
      const post = await Post.findById(postId).select('user likeCount').session(session);
      if (!post) {
        throw new Error('POST_NOT_FOUND');
      }

      const like = await Like.findOneAndDelete({ user: req.user.id, post: postId }).session(session);
      if (!like) {
        throw new Error('LIKE_NOT_FOUND');
      }

      deleted = true;
      postOwnerId = post.user;
      post.likeCount = await Like.countDocuments({ post: postId }).session(session);
      await post.save({ session });
    });

    if (!deleted) {
      res.status(404).json({ msg: '未点赞' });
      return;
    }

    if (postOwnerId) {
      await deleteInteractionNotification({
        recipient: postOwnerId,
        actor: req.user.id,
        type: 'like',
        post: postId,
      });
    }

    res.json({ msg: '已取消点赞' });
  } catch (err) {
    if (err.message === 'POST_NOT_FOUND') {
      res.status(404).json({ msg: '帖子不存在' });
      return;
    }

    if (err.message === 'LIKE_NOT_FOUND') {
      res.status(404).json({ msg: '未点赞' });
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
    const likes = await Like.find({ user: req.user.id, post: { $in: ids } });
    const map = {};
    likes.forEach(l => { map[l.post.toString()] = true; });
    res.json(map);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/mine', auth, async (req, res) => {
  try {
    const likes = await Like.find({ user: req.user.id }).sort({ createdAt: -1 });
    const postIds = likes.map(l => l.post);
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
