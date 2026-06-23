const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// 1. 顶层优先注册CORS，全局处理OPTIONS预检（关键修复）
app.use(cors({
  origin: /\.vercel\.app$/,
  allowedHeaders: ['Content-Type', 'x-auth-token'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
// 捕获所有OPTIONS预检请求，直接返回204成功
app.options('*', (req, res) => res.sendStatus(204));

// 解析JSON请求体
app.use(express.json());

// 根路由测试
app.get('/', (req, res) => {
  res.send('Hello, xiaoyuanAPP!');
});

// 日志中间件移到路由注册前，不影响预检
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// 所有业务路由
app.use('/api/users', require('./routes/users'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/follow', require('./routes/follow'));
app.use('/api/likes', require('./routes/likes'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/bookmarks', require('./routes/bookmarks'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/ai', require('./routes/ai'));

// MongoDB连接
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

// 本地开发才启用监听端口，Vercel部署会自动忽略此段
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`xiaoyuanAPP backend is running at http://localhost:${port}`);
  });
}

// 导出app供Vercel @vercel/node使用
module.exports = app;
