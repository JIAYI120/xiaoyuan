const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// 跨域配置，放行所有vercel前端域名与自定义token头
app.use(cors({
  origin: /\.vercel\.app$/,
  allowedHeaders: ['Content-Type', 'x-auth-token'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// 中间件拦截OPTIONS预检，规避 app.options('*') 正则解析报错
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// 解析json请求体
app.use(express.json());

// 根路由测试
app.get('/', (req, res) => {
  res.send('Hello, xiaoyuanAPP!');
});

// 请求日志打印中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// 所有业务路由挂载
app.use('/api/users', require('./routes/users'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/follow', require('./routes/follow'));
app.use('/api/likes', require('./routes/likes'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/bookmarks', require('./routes/bookmarks'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/ai', require('./routes/ai'));

// 连接MongoDB数据库
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));


app.listen(port, '0.0.0.0', () => {
  console.log(`xiaoyuanAPP backend is running on port ${port}`);
});

// Vercel @vercel/node 强制要求导出app实例
module.exports = app;
