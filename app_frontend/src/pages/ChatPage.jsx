import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import styles from './Chat.module.css';

function formatNow() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function normalizeMessages(list = [], currentUserId) {
  return list.map((item, index) => {
    const isSelf = item.sender === 'self'
      || item.isSelf === true
      || (currentUserId && item.senderId?.toString() === currentUserId.toString());

    return {
      id: item._id || item.id || `msg_${index}`,
      sender: isSelf ? 'self' : 'other',
      content: item.content || '',
      time: item.time || item.createdAtLabel || item.createdAt || '',
      sortTime: item.createdAt || item.time || index,
    };
  }).sort((a, b) => new Date(a.sortTime).getTime() - new Date(b.sortTime).getTime());
}

function MoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { token, user } = useAuth();
  const conversation = location.state?.conversation;
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [chatInfo, setChatInfo] = useState({ conversationId: conversation?.id || '', isPinned: conversation?.isPinned || false, isMuted: conversation?.isMuted || false });
  const chatBodyRef = useRef(null);
  const shouldStickToBottomRef = useRef(true);

  const currentUserId = user?._id || user?.id || '';
  const authReady = Boolean(token) && Boolean(user);

  const fallbackPartner = useMemo(() => ({
    userId: id,
    nickname: '私信会话',
    avatarText: '聊',
  }), [id]);

  const [partner, setPartner] = useState(conversation || fallbackPartner);

  useEffect(() => {
    setPartner(conversation || fallbackPartner);
    setChatInfo(prev => ({
      ...prev,
      conversationId: conversation?.id || prev.conversationId || '',
      isPinned: conversation?.isPinned || false,
      isMuted: conversation?.isMuted || false,
    }));
  }, [conversation, fallbackPartner]);

  const updateScrollIntent = useCallback(() => {
    const container = chatBodyRef.current;
    if (!container) {
      return;
    }
    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldStickToBottomRef.current = distanceToBottom < 80;
  }, []);

  const scrollToBottom = useCallback(() => {
    const container = chatBodyRef.current;
    if (!container) {
      return;
    }
    container.scrollTop = container.scrollHeight;
  }, []);

  const fetchHistory = useCallback(async ({ silent = false } = {}) => {
    if (!id || !token) {
      return;
    }

    if (!silent) {
      setLoading(true);
    }

    try {
      const [historyRes, detailRes] = await Promise.all([
        apiClient.get(`/messages/history/${id}`),
        apiClient.get(`/messages/conversation-detail/${id}`),
      ]);
      const data = historyRes.data || {};
      const detail = detailRes.data || {};
      if (data.partner) {
        setPartner(prev => ({ ...prev, ...data.partner }));
      }
      setChatInfo({
        conversationId: detail.conversationId || data.conversationId || '',
        isPinned: Boolean(detail.isPinned),
        isMuted: Boolean(detail.isMuted),
      });
      setMessages(prev => {
        const nextMessages = normalizeMessages(data.messages || [], currentUserId);
        if (prev.length === nextMessages.length && prev.every((item, index) => item.id === nextMessages[index]?.id && item.content === nextMessages[index]?.content && item.time === nextMessages[index]?.time)) {
          return prev;
        }
        return nextMessages;
      });
      setErrorText('');
    } catch (err) {
      if (!silent) {
        setMessages([]);
      }
      setErrorText(err.response?.data?.msg || '私信加载失败');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [id, token, currentUserId]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setMessages([]);
      setErrorText('登录状态失效，请重新登录');
      return;
    }

    if (!user) {
      setLoading(true);
      return;
    }

    if (id && authReady) {
      shouldStickToBottomRef.current = true;
      fetchHistory();
    }
  }, [id, token, user, authReady, fetchHistory]);

  useEffect(() => {
    if (!id || !authReady) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      fetchHistory({ silent: true });
    }, 2000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchHistory({ silent: true });
      }
    };

    const handleFocus = () => {
      fetchHistory({ silent: true });
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id, authReady, fetchHistory]);

  useEffect(() => {
    if (shouldStickToBottomRef.current) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || sending) return;
    if (!authReady) {
      setErrorText('登录信息加载中，请稍后再试');
      return;
    }

    setErrorText('');
    shouldStickToBottomRef.current = true;

    const optimistic = {
      id: `local_${Date.now()}`,
      sender: 'self',
      content,
      time: formatNow(),
      sortTime: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimistic]);
    setDraft('');
    setSending(true);

    try {
      const res = await apiClient.post(`/messages/${id}`, { content });
      const saved = normalizeMessages([res.data], currentUserId)[0];
      setMessages(prev => {
        const replaced = prev.map(item => item.id === optimistic.id ? saved : item);
        const hasOptimistic = prev.some(item => item.id === optimistic.id);
        return hasOptimistic ? replaced : [...prev, saved];
      });
      fetchHistory({ silent: true });
    } catch (err) {
      setMessages(prev => prev.filter(item => item.id !== optimistic.id));
      setDraft(content);
      setErrorText(err.response?.data?.msg || '私信发送失败');
    } finally {
      setSending(false);
    }
  };

  const openChatInfo = () => {
    navigate(`/messages/${id}/info`, {
      state: {
        conversation: {
          id: chatInfo.conversationId,
          userId: id,
          nickname: partner.nickname,
          avatarText: partner.avatarText,
          isPinned: chatInfo.isPinned,
          isMuted: chatInfo.isMuted,
        },
      },
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.phoneFrame}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className={styles.headerTitle}>{partner.nickname}</div>
          <button className={styles.moreBtn} onClick={openChatInfo} aria-label="聊天信息">
            <MoreIcon />
          </button>
        </div>

        <div className={styles.chatBody} ref={chatBodyRef} onScroll={updateScrollIntent}>
          {loading ? (
            <div className={styles.emptyState}>正在加载历史私信...</div>
          ) : messages.length === 0 ? (
            <div className={styles.emptyState}>{errorText || '暂无私信记录'}</div>
          ) : (
            messages.map(item => (
              <div key={item.id} className={`${styles.msgRow} ${item.sender === 'self' ? styles.self : styles.other}`}>
                <div className={styles.msgBubbleWrap}>
                  <div className={styles.msgBubble}>{item.content}</div>
                  <div className={styles.msgTime}>{item.time}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {errorText && messages.length > 0 && <div className={styles.errorBar}>{errorText}</div>}

        <div className={styles.inputBar}>
          <input
            className={styles.input}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="输入私信内容..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button className={styles.sendBtn} onClick={handleSend} disabled={sending || !draft.trim()}>
            发送
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
