const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// 1. 先处理OPTIONS预检请求（放cors前面）
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// 2. 再配置CORS白名单（兼容本地localhost+线上域名）
app.use(cors({
  origin: /^(http:\/\/localhost:\d+)|(\.(vercel\.app|up\.railway\.app))$/,
  allowedHeaders: ['Content-Type', 'x-auth-token'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

// 日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// 根路由
app.get('/', (req, res) => {
  res.send('Hello, xiaoyuanAPP!');
});

// 业务路由
app.use('/api/users', require('./routes/users'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/follow', require('./routes/follow'));
app.use('/api/likes', require('./routes/likes'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/bookmarks', require('./routes/bookmarks'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/ai', require('./routes/ai'));

// 数据库连接
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(port, '0.0.0.0', () => {
  console.log(`xiaoyuanAPP backend is running on port ${port}`);
});

module.exports = app;
