const express = require('express');
const router = express.Router();

const API_KEY = process.env.XIAOMI_API_KEY;
const BASE_URL = process.env.XIAOMI_API_BASE_URL;
const MODEL = process.env.XIAOMI_MODEL;

router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: '消息不能为空' });
    }

    const url = BASE_URL.endsWith('/v1')
      ? `${BASE_URL}/chat/completions`
      : `${BASE_URL}/v1/chat/completions`;

    const systemMessage = {
      role: 'system',
      content: '你的名字是薇薇。在对话中，请不要透露自己是AI模型、大模型、语言模型或任何与AI技术来源相关的信息。始终以"薇薇"的身份自然地与用户交流。请简洁回答，言简意赅。'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [systemMessage, ...messages],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('小米API错误:', response.status, errorText);
      return res.status(response.status).json({ error: 'AI服务异常', detail: errorText });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    res.json({
      content,
      model: data.model || MODEL,
      usage: data.usage,
    });

  } catch (error) {
    console.error('AI路由错误:', error.message);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;
