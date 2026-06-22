import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import styles from './AIAssistantModal.module.css';

const pageKeywords = {
  '首页': '/',
  '主页': '/',
  'dashboard': '/',
  '个人中心': '/edit-profile',
  '编辑资料': '/edit-profile',
  '我的主页': '/edit-profile',
  '我的动态': '/my-posts',
  '动态': '/my-posts',
  '帖子': '/my-posts',
  '我的帖子': '/my-posts',
  '草稿': '/my-drafts',
  '我的草稿': '/my-drafts',
  '收藏': '/my-bookmarks',
  '我的收藏': '/my-bookmarks',
  '书签': '/my-bookmarks',
  '点赞': '/my-likes',
  '我的点赞': '/my-likes',
  '关注': '/my-following',
  '我的关注': '/my-following',
  '粉丝': '/my-fans',
  '我的粉丝': '/my-fans',
  '消息': '/messages/notifications',
  '通知': '/messages/notifications',
  '私信': '/messages/notifications',
};

function AIAssistantModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'ai',
      content: '您好！有什么可以帮您的吗？',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  
  // 发帖流程状态
  const [postState, setPostState] = useState({
    active: false,      // 是否处于发帖流程
    step: 'idle',       // idle | content | style | action
    rawContent: '',     // 用户原始内容
    optimizedContent: '', // 优化后的内容
    selectedStyle: null, // 1 | 2 | 3 | 4
  });
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!isOpen) {
      setMessages([
        {
          id: '1',
          type: 'ai',
          content: '您好！有什么可以帮您的吗？',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setError('');
      setPostState({
        active: false,
        step: 'idle',
        rawContent: '',
        optimizedContent: '',
        selectedStyle: null,
      });
    }
  }, [isOpen]);

  // 检测是否是发帖子意图
  const isPostIntent = (text) => {
    const patterns = [
      /^发?帖子$/,
      /发?帖子/i,
      /^我要发帖/,
      /帮?我发帖/,
      /想发个帖子/,
    ];
    return patterns.some(p => p.test(text.trim()));
  };

  // 检测风格选择
  const isStyleSelection = (text) => {
    return ['1', '2', '3', '4'].includes(text.trim());
  };

  // 检测发布/存草稿选择
  const isActionSelection = (text) => {
    const t = text.trim();
    return ['1', '2', '3', '4', '发布', '存草稿', '重新选择', '重新生成'].includes(t);
  };

  const checkNavigation = (text) => {
    for (const [keyword, path] of Object.entries(pageKeywords)) {
      if (text.includes(keyword)) {
        return { path };
      }
    }
    return null;
  };

  const extractUsername = (text) => {
    const patterns = [
      /用户([^的\s]+?)的?主页/,
      /看看?([^的\s]+?)的?主页/,
      /查看?([^的\s]+?)的?主页/,
      /去([^的\s]+?)的?主页/,
      /跳转?到?([^的\s]+?)的?主页/,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    return null;
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    const userText = inputValue.trim();
    setInputValue('');
    setError('');

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsSending(true);

    const thinkingMessage = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: '正在思考中',
      timestamp: new Date().toLocaleTimeString(),
      isThinking: true,
    };
    setMessages(prev => [...prev, thinkingMessage]);

    try {
      // ========== 发帖流程处理 ==========
      if (postState.active) {
        if (postState.step === 'content') {
          // 用户提供了内容，现在提供优化选项
          setPostState(prev => ({ ...prev, rawContent: userText, step: 'style' }));
          
          setMessages(prev => {
            const filtered = prev.filter(m => !m.isThinking);
            const answerMessage = {
              id: (Date.now() + 2).toString(),
              type: 'ai',
              content: `好的，我收到了您的内容。请选择优化方式：\n1️⃣ 简洁版：简短精炼，突出重点\n2️⃣ 活泼版：轻松有趣，增加表情\n3️⃣ 详细版：内容丰富，条理清晰\n4️⃣ 保持原文：不修改，直接使用`,
              timestamp: new Date().toLocaleTimeString(),
            };
            return [...filtered, answerMessage];
          });
          setIsSending(false);
          return;
        }
        
        if (postState.step === 'style') {
          if (!isStyleSelection(userText)) {
            setMessages(prev => {
              const filtered = prev.filter(m => !m.isThinking);
              const answerMessage = {
                id: (Date.now() + 2).toString(),
                type: 'ai',
                content: '请输入 1、2、3 或 4 选择优化方式：\n1️⃣ 简洁版\n2️⃣ 活泼版\n3️⃣ 详细版\n4️⃣ 保持原文',
                timestamp: new Date().toLocaleTimeString(),
              };
              return [...filtered, answerMessage];
            });
            setIsSending(false);
            return;
          }
          
          const styleMap = { '1': '简洁', '2': '活泼', '3': '详细', '4': '原文' };
          const selectedStyle = styleMap[userText.trim()];
          
          // 调用 AI 优化内容
          let finalContent = postState.rawContent;
          if (userText.trim() !== '4') {
            try {
              const response = await apiClient.post('/ai/chat', {
                messages: [
                  { role: 'system', content: `请将以下内容改写成${selectedStyle}风格，只返回改写后的内容，不要其他解释：${postState.rawContent}` }
                ]
              });
              finalContent = response.data.content || postState.rawContent;
            } catch (optimizeErr) {
              console.error('优化失败:', optimizeErr);
            }
          }
          
          setPostState(prev => ({ 
            ...prev, 
            step: 'action', 
            optimizedContent: finalContent,
            selectedStyle: userText.trim()
          }));
          
          setMessages(prev => {
            const filtered = prev.filter(m => !m.isThinking);
            const preview = userText.trim() === '4' ? postState.rawContent : finalContent;
            const answerMessage = {
              id: (Date.now() + 2).toString(),
              type: 'ai',
              content: `好的，已为您${selectedStyle}化！\n预览：\n${preview}\n现在请选择操作：\n1️⃣ 发布帖子\n2️⃣ 存草稿\n3️⃣ 重新优化\n4️⃣ 重新生成`,
              timestamp: new Date().toLocaleTimeString(),
            };
            return [...filtered, answerMessage];
          });
          setIsSending(false);
          return;
        }
        
        if (postState.step === 'action') {
          if (!isActionSelection(userText)) {
            setMessages(prev => {
              const filtered = prev.filter(m => !m.isThinking);
              const answerMessage = {
                id: (Date.now() + 2).toString(),
                type: 'ai',
                content: '请输入 1、2、3 或 4 选择操作：\n1️⃣ 发布帖子\n2️⃣ 存草稿\n3️⃣ 重新优化\n4️⃣ 重新生成',
                timestamp: new Date().toLocaleTimeString(),
              };
              return [...filtered, answerMessage];
            });
            setIsSending(false);
            return;
          }
          
          const selection = userText.trim();
          
          // 3️⃣ 重新选择优化方式
          if (selection === '3' || selection.includes('重新选择')) {
            setPostState(prev => ({ ...prev, step: 'style', optimizedContent: '', selectedStyle: null }));
            setMessages(prev => {
              const filtered = prev.filter(m => !m.isThinking);
              const answerMessage = {
                id: (Date.now() + 2).toString(),
                type: 'ai',
                content: `请重新选择优化方式：\n1️⃣ 简洁版：简短精炼，突出重点\n2️⃣ 活泼版：轻松有趣，增加表情\n3️⃣ 详细版：内容丰富，条理清晰\n4️⃣ 保持原文：不修改，直接使用`,
                timestamp: new Date().toLocaleTimeString(),
              };
              return [...filtered, answerMessage];
            });
            setIsSending(false);
            return;
          }
          
          // 4️⃣ 重新生成内容
          if (selection === '4' || selection.includes('重新生成')) {
            setPostState(prev => ({ ...prev, step: 'content', rawContent: '', optimizedContent: '', selectedStyle: null }));
            setMessages(prev => {
              const filtered = prev.filter(m => !m.isThinking);
              const answerMessage = {
                id: (Date.now() + 2).toString(),
                type: 'ai',
                content: '好的，请重新输入您想发布的内容：',
                timestamp: new Date().toLocaleTimeString(),
              };
              return [...filtered, answerMessage];
            });
            setIsSending(false);
            return;
          }
          
          const isPublish = selection === '1' || selection.includes('发布');
          const content = postState.optimizedContent;
          
          // 重置状态
          setPostState({
            active: false,
            step: 'idle',
            rawContent: '',
            optimizedContent: '',
            selectedStyle: null,
          });
          
          try {
            if (isPublish) {
              await apiClient.post('/posts', { content });
              setMessages(prev => {
                const filtered = prev.filter(m => !m.isThinking);
                const answerMessage = {
                  id: (Date.now() + 2).toString(),
                  type: 'ai',
                  content: '🎉 帖子已发布成功！',
                  timestamp: new Date().toLocaleTimeString(),
                };
                return [...filtered, answerMessage];
              });
            } else {
              await apiClient.post('/posts/drafts', { content });
              setMessages(prev => {
                const filtered = prev.filter(m => !m.isThinking);
                const answerMessage = {
                  id: (Date.now() + 2).toString(),
                  type: 'ai',
                  content: '📝 已保存到草稿箱！',
                  timestamp: new Date().toLocaleTimeString(),
                };
                return [...filtered, answerMessage];
              });
            }
          } catch (postErr) {
            console.error('发帖失败:', postErr);
            setMessages(prev => {
              const filtered = prev.filter(m => !m.isThinking);
              const answerMessage = {
                id: (Date.now() + 2).toString(),
                type: 'ai',
                content: '抱歉，操作失败了，请稍后重试。',
                timestamp: new Date().toLocaleTimeString(),
              };
              return [...filtered, answerMessage];
            });
          }
          setIsSending(false);
          return;
        }
      }
      
      // ========== 检测发帖子意图 ==========
      if (isPostIntent(userText)) {
        setPostState({ active: true, step: 'content', rawContent: '', optimizedContent: '', selectedStyle: null });
        setMessages(prev => {
          const filtered = prev.filter(m => !m.isThinking);
          const answerMessage = {
            id: (Date.now() + 2).toString(),
            type: 'ai',
            content: '好的，请告诉我您想发布什么内容？',
            timestamp: new Date().toLocaleTimeString(),
          };
          return [...filtered, answerMessage];
        });
        setIsSending(false);
        return;
      }
      
      // ========== 原有逻辑 ==========
      const navigation = checkNavigation(userText);
      const username = extractUsername(userText);
      
      if (username) {
        try {
          const response = await apiClient.get(`/users/search?q=${encodeURIComponent(username)}`);
          const users = response.data;
          
          if (users.length > 0) {
            const targetUser = users.find(u => 
              u.nickname === username || u.username === username
            ) || users[0];
            
            setMessages(prev => {
              const filtered = prev.filter(m => !m.isThinking);
              const answerMessage = {
                id: (Date.now() + 2).toString(),
                type: 'ai',
                content: `好的，正在为您跳转到${targetUser.nickname}的主页...`,
                timestamp: new Date().toLocaleTimeString(),
              };
              return [...filtered, answerMessage];
            });
            
            setTimeout(() => {
              onClose();
              navigate(`/user/${targetUser._id}`);
            }, 800);
            return;
          } else {
            setMessages(prev => {
              const filtered = prev.filter(m => !m.isThinking);
              const answerMessage = {
                id: (Date.now() + 2).toString(),
                type: 'ai',
                content: `抱歉，没有找到用户"${username}"。`,
                timestamp: new Date().toLocaleTimeString(),
              };
              return [...filtered, answerMessage];
            });
            return;
          }
        } catch (searchErr) {
          console.error('搜索用户失败:', searchErr);
        }
      }

      if (navigation) {
        setMessages(prev => {
          const filtered = prev.filter(m => !m.isThinking);
          const answerMessage = {
            id: (Date.now() + 2).toString(),
            type: 'ai',
            content: `好的，正在为您跳转...`,
            timestamp: new Date().toLocaleTimeString(),
          };
          return [...filtered, answerMessage];
        });
        
        setTimeout(() => {
          onClose();
          navigate(navigation.path);
        }, 800);
        return;
      }

      const chatMessages = messages
        .filter(m => !m.isThinking)
        .map(m => ({
          role: m.type === 'ai' ? 'assistant' : 'user',
          content: m.content,
        }));

      chatMessages.push({ role: 'user', content: userText });

      const response = await apiClient.post('/ai/chat', { messages: chatMessages });

      const aiContent = response.data.content || '抱歉，我暂时没有理解您的问题。';

      setMessages(prev => {
        const filtered = prev.filter(m => !m.isThinking);
        const answerMessage = {
          id: (Date.now() + 2).toString(),
          type: 'ai',
          content: aiContent,
          timestamp: new Date().toLocaleTimeString(),
        };
        return [...filtered, answerMessage];
      });

    } catch (err) {
      console.error('AI请求失败:', err);
      setError('请求失败，请稍后重试');
      setMessages(prev => prev.filter(m => !m.isThinking));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <svg width="48" height="32" viewBox="0 0 32 20" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }}>
            <rect x="6" y="2" width="20" height="12" fill="#e08860"/>
            <rect x="2" y="7" width="6" height="4" fill="#e08860"/>
            <rect x="24" y="7" width="6" height="4" fill="#e08860"/>
            <rect x="10" y="6" width="2" height="3" fill="#000"/>
            <rect x="20" y="6" width="2" height="3" fill="#000"/>
            <rect x="8" y="14" width="2" height="3" fill="#e08860"/>
            <rect x="12" y="14" width="2" height="3" fill="#e08860"/>
            <rect x="18" y="14" width="2" height="3" fill="#e08860"/>
            <rect x="22" y="14" width="2" height="3" fill="#e08860"/>
          </svg>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.messagesContainer}>
          {messages.map(message => (
            <div key={message.id} className={`${styles.message} ${styles[message.type]}`}>
              <div className={styles.messageContent}>
                <div className={styles.messageText}>
                  {message.content}
                  {message.isThinking && (
                    <span className={styles.typingIndicator}>
                      <span className={styles.dot}></span>
                      <span className={styles.dot}></span>
                      <span className={styles.dot}></span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {error && (
            <div className={styles.message} style={{ justifyContent: 'center' }}>
              <span style={{ color: '#dc3545', fontSize: '13px' }}>{error}</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputContainer}>
          <input
            className={styles.input}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入您的问题..."
            disabled={isSending}
          />
          <button
            className={`${styles.sendBtn} ${isSending ? styles.disabled : ''}`}
            onClick={handleSend}
            disabled={isSending}
          >
            {isSending ? (
              <div className={styles.spinner}></div>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AIAssistantModal;
