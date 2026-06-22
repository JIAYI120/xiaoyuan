const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Profile = require('../models/Profile');

router.post('/register', async (req, res) => {
    try {
        const { name, password } = req.body;

        if (!name || !password) {
            return res.status(400).json({ msg: '用户名和密码不能为空' });
        }

        const existingUser = await User.findOne({ name });
        if (existingUser) {
            return res.status(400).json({ msg: '用户名已存在' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            name,
            password: hashedPassword,
        });
        await user.save();

        await Profile.create({
            user: user._id,
            nickname: name,
        });

        const payload = {
            user: {
                id: user._id,
            },
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/login', async (req, res) => {
    try {
        const { name, password } = req.body;

        if (!name || !password) {
            return res.status(400).json({ msg: '用户名和密码不能为空' });
        }

        const user = await User.findOne({ name });
        if (!user) {
            return res.status(400).json({ msg: '用户名或密码错误' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: '用户名或密码错误' });
        }

        const payload = {
            user: {
                id: user._id,
            },
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        const profile = await Profile.findOne({ user: req.user.id });
        res.json({
            ...user.toObject(),
            nickname: profile?.nickname || user.name || '',
            identity: profile?.identity || '学生',
            bio: profile?.bio || '用文字记录校园生活的每一刻',
            gender: profile?.gender || '',
            birthday: profile?.birthday || '',
            location: profile?.location || '',
        });
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

        const [profiles, users] = await Promise.all([
            Profile.find({ nickname: regex }).limit(20),
            User.find({ name: regex }).select('name').limit(20),
        ]);

        const profileUserIds = profiles.map(item => item.user.toString());
        const matchedUsers = users.filter(item => !profileUserIds.includes(item._id.toString()));
        const extraUserIds = matchedUsers.map(item => item._id.toString());

        const extraProfiles = extraUserIds.length
            ? await Profile.find({ user: { $in: extraUserIds } })
            : [];

        const userMap = users.reduce((map, item) => {
            map[item._id.toString()] = item;
            return map;
        }, {});
        const profileMap = extraProfiles.reduce((map, item) => {
            map[item.user.toString()] = item;
            return map;
        }, {});

        const profileResults = profiles.map(profile => {
            const uid = profile.user.toString();
            const user = userMap[uid];
            return {
                _id: uid,
                username: user?.name || '',
                nickname: profile.nickname || user?.name || '',
                identity: profile.identity || '学生',
                bio: profile.bio || '这个人很低调，暂时没有填写简介',
            };
        });

        const userResults = matchedUsers.map(item => {
            const profile = profileMap[item._id.toString()];
            return {
                _id: item._id.toString(),
                username: item.name || '',
                nickname: profile?.nickname || item.name || '',
                identity: profile?.identity || '学生',
                bio: profile?.bio || '这个人很低调，暂时没有填写简介',
            };
        });

        res.json([...profileResults, ...userResults].slice(0, 20));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.put('/profile', auth, async (req, res) => {
    try {
        const { nickname, identity, bio, gender, birthday, location } = req.body;
        let profile = await Profile.findOne({ user: req.user.id });
        if (!profile) {
            profile = new Profile({ user: req.user.id });
        }
        if (nickname !== undefined) profile.nickname = nickname;
        if (identity !== undefined) profile.identity = identity;
        if (bio !== undefined) profile.bio = bio;
        if (gender !== undefined) profile.gender = gender;
        if (birthday !== undefined) profile.birthday = birthday;
        if (location !== undefined) profile.location = location;
        await profile.save();

        const user = await User.findById(req.user.id).select('-password');
        res.json({
            ...user.toObject(),
            nickname: profile?.nickname || user.name || '',
            identity: profile?.identity || '学生',
            bio: profile?.bio || '用文字记录校园生活的每一刻',
            gender: profile?.gender || '',
            birthday: profile?.birthday || '',
            location: profile?.location || '',
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/:id/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('name');
        if (!user) {
            return res.status(404).json({ msg: '用户不存在' });
        }
        const Post = require('../models/Post');
        const Follow = require('../models/Follow');
        const [profile, postCount, followingCount, fansCount, isFollowing, isFollowedBy] = await Promise.all([
            Profile.findOne({ user: req.params.id }),
            Post.countDocuments({ user: req.params.id }),
            Follow.countDocuments({ follower: req.params.id }),
            Follow.countDocuments({ following: req.params.id }),
            Follow.findOne({ follower: req.user.id, following: req.params.id }),
            Follow.findOne({ follower: req.params.id, following: req.user.id }),
        ]);
        res.json({
            _id: user._id,
            name: user.name,
            nickname: profile?.nickname || user.name || '',
            identity: profile?.identity || '学生',
            bio: profile?.bio || '用文字记录校园生活的每一刻',
            gender: profile?.gender || '',
            birthday: profile?.birthday || '',
            location: profile?.location || '',
            postCount,
            followingCount,
            fansCount,
            isFollowing: !!isFollowing,
            isFollowedBy: !!isFollowedBy,
            isMutual: !!isFollowing && !!isFollowedBy,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
