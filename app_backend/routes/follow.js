const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Follow = require('../models/Follow');
const { createInteractionNotification } = require('../utils/interactionNotifications');

router.get('/count', auth, async (req, res) => {
  try {
    const followingCount = await Follow.countDocuments({ follower: req.user.id });
    const fansCount = await Follow.countDocuments({ following: req.user.id });
    res.json({ followingCount, fansCount });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/following', auth, async (req, res) => {
  try {
    const follows = await Follow.find({ follower: req.user.id });
    const userIds = follows.map(f => f.following.toString());
    const Profile = require('../models/Profile');
    const User = require('../models/User');
    const [profiles, users] = await Promise.all([
      Profile.find({ user: { $in: userIds } }),
      User.find({ _id: { $in: userIds } }).select('name'),
    ]);
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.user.toString()] = p; });
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });
    const result = userIds.map(uid => {
      const prof = profileMap[uid];
      const u = userMap[uid];
      return {
        _id: uid,
        nickname: prof?.nickname || u?.name || '',
        identity: prof?.identity || '学生',
        isFollowing: true,
      };
    });
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/fans', auth, async (req, res) => {
  try {
    const follows = await Follow.find({ following: req.user.id });
    const userIds = follows.map(f => f.follower.toString());
    const Profile = require('../models/Profile');
    const User = require('../models/User');
    const [profiles, users] = await Promise.all([
      Profile.find({ user: { $in: userIds } }),
      User.find({ _id: { $in: userIds } }).select('name'),
    ]);
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.user.toString()] = p; });
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });
    const myFollowing = await Follow.find({ follower: req.user.id }).select('following');
    const myFollowingSet = new Set(myFollowing.map(f => f.following.toString()));
    const result = userIds.map(uid => {
      const prof = profileMap[uid];
      const u = userMap[uid];
      return {
        _id: uid,
        nickname: prof?.nickname || u?.name || '',
        identity: prof?.identity || '学生',
        mutual: myFollowingSet.has(uid),
      };
    });
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/:userId', auth, async (req, res) => {
  try {
    if (req.params.userId === req.user.id) {
      return res.status(400).json({ msg: '不能关注自己' });
    }
    const existing = await Follow.findOne({
      follower: req.user.id,
      following: req.params.userId,
    });
    if (existing) {
      return res.status(400).json({ msg: '已关注' });
    }
    const follow = new Follow({
      follower: req.user.id,
      following: req.params.userId,
    });
    await follow.save();
    await createInteractionNotification({
      recipient: req.params.userId,
      actor: req.user.id,
      type: 'follow',
    });
    const isMutual = await Follow.exists({ follower: req.params.userId, following: req.user.id });
    res.json({
      ...follow.toObject(),
      isMutual: Boolean(isMutual),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.delete('/:userId', auth, async (req, res) => {
  try {
    await Follow.findOneAndDelete({
      follower: req.user.id,
      following: req.params.userId,
    });
    res.json({ msg: '已取消关注' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
