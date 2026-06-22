const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const PostDraft = require('../models/PostDraft');
const Profile = require('../models/Profile');
const User = require('../models/User');
const Follow = require('../models/Follow');
const Like = require('../models/Like');
const Bookmark = require('../models/Bookmark');

function normalizeDraft(draft) {
  return {
    ...draft.toObject(),
    updatedAt: draft.updatedAt,
  };
}

async function attachPostUsers(posts) {
  const userIds = [...new Set(posts.map(p => p.user.toString()))];
  const [profiles, users] = await Promise.all([
    Profile.find({ user: { $in: userIds } }),
    User.find({ _id: { $in: userIds } }).select('name'),
  ]);
  const profileMap = {};
  profiles.forEach(p => { profileMap[p.user.toString()] = p; });
  const userMap = {};
  users.forEach(u => { userMap[u._id.toString()] = u; });
  return posts.map(p => {
    const uid = p.user.toString();
    const prof = profileMap[uid];
    const u = userMap[uid];
    return {
      ...p.toObject(),
      nickname: prof?.nickname || u?.name || '',
      identity: prof?.identity || '学生',
    };
  });
}

router.get('/drafts', auth, async (req, res) => {
  try {
    const drafts = await PostDraft.find({ user: req.user.id }).sort({ updatedAt: -1 });
    res.json(drafts.map(normalizeDraft));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/drafts', auth, async (req, res) => {
  try {
    const { content, images, topic } = req.body;
    const draft = new PostDraft({
      user: req.user.id,
      content: typeof content === 'string' ? content.trim() : '',
      topic: typeof topic === 'string' ? topic.trim() : '',
      images: Array.isArray(images) ? images : [],
    });
    await draft.save();
    res.json(normalizeDraft(draft));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/drafts/:id', auth, async (req, res) => {
  try {
    const draft = await PostDraft.findById(req.params.id);
    if (!draft) {
      return res.status(404).json({ msg: '草稿不存在' });
    }
    if (draft.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: '无权修改' });
    }
    draft.content = typeof req.body.content === 'string' ? req.body.content.trim() : draft.content;
    draft.topic = typeof req.body.topic === 'string' ? req.body.topic.trim() : draft.topic;
    draft.images = Array.isArray(req.body.images) ? req.body.images : draft.images;
    await draft.save();
    res.json(normalizeDraft(draft));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.delete('/drafts/:id', auth, async (req, res) => {
  try {
    const draft = await PostDraft.findById(req.params.id);
    if (!draft) {
      return res.status(404).json({ msg: '草稿不存在' });
    }
    if (draft.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: '无权删除' });
    }
    await draft.deleteOne();
    res.json({ msg: '已删除' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/mine', auth, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    const result = await attachPostUsers(posts);
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/feed', auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(50);
    const result = await attachPostUsers(posts);
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/search', auth, async (req, res) => {
  try {
    const keyword = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!keyword) {
      return res.json([]);
    }

    const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(safeKeyword, 'i');

    const posts = await Post.find({
      $or: [
        { content: regex },
        { topic: regex },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const result = await attachPostUsers(posts);
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/friends', auth, async (req, res) => {
  try {
    const myFollowing = await Follow.find({ follower: req.user.id }).select('following');
    const followingIds = myFollowing.map(item => item.following.toString());

    if (followingIds.length === 0) {
      return res.json([]);
    }

    const reverseFollows = await Follow.find({
      follower: { $in: followingIds },
      following: req.user.id,
    }).select('follower');

    const friendIds = reverseFollows.map(item => item.follower.toString());

    if (friendIds.length === 0) {
      return res.json([]);
    }

    const posts = await Post.find({ user: { $in: friendIds } })
      .sort({ createdAt: -1 })
      .limit(50);

    const result = await attachPostUsers(posts);
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/count', auth, async (req, res) => {
  try {
    const count = await Post.countDocuments({ user: req.user.id });
    res.json({ count });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/user/:userId', auth, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.userId })
      .sort({ createdAt: -1 });
    const result = await attachPostUsers(posts);
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { content, images, topic, draftId } = req.body;
    const post = new Post({
      user: req.user.id,
      content,
      topic: typeof topic === 'string' ? topic.trim() : '',
      images: images || [],
    });
    await post.save();

    if (draftId) {
      const draft = await PostDraft.findById(draftId);
      if (draft && draft.user.toString() === req.user.id) {
        await draft.deleteOne();
      }
    }

    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: '动态不存在' });
    }
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: '无权删除' });
    }
    const Like = require('../models/Like');
    const Bookmark = require('../models/Bookmark');
    const Comment = require('../models/Comment');
    await Promise.all([
      Like.deleteMany({ post: req.params.id }),
      Bookmark.deleteMany({ post: req.params.id }),
      Comment.deleteMany({ post: req.params.id }),
      post.deleteOne(),
    ]);
    res.json({ msg: '已删除' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: '帖子不存在' });
    }
    
    const [result, likes, bookmarks] = await Promise.all([
      attachPostUsers([post]),
      Like.findOne({ user: req.user.id, post: req.params.id }),
      Bookmark.findOne({ user: req.user.id, post: req.params.id }),
    ]);
    
    const postData = result[0];
    postData.liked = !!likes;
    postData.bookmarked = !!bookmarks;
    
    res.json(postData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
