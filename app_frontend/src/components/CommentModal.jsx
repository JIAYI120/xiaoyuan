import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';
import styles from './CommentModal.module.css';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}个月前`;
  return `${Math.floor(months / 12)}年前`;
}

function CommentModal({ open, postId, onClose, onCountChange }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!postId) {
      setComments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setComments([]);
    try {
      const res = await apiClient.get(`/comments/${postId}`);
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (open && postId) {
      fetchComments();
    } else {
      setComments([]);
      setLoading(false);
      setText('');
    }
  }, [open, postId, fetchComments]);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.documentElement.style.overflow = '';
      return undefined;
    }

    const scrollY = window.scrollY;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  const handleSend = async () => {
    if (!text.trim() || sending || !postId) return;
    setSending(true);
    try {
      const res = await apiClient.post(`/comments/${postId}`, { content: text.trim() });
      setComments(prev => [res.data, ...prev]);
      setText('');
      onCountChange?.(1);
    } catch {
      setComments(prev => prev);
    }
    setSending(false);
  };

  const handleDelete = async (commentId) => {
    try {
      await apiClient.delete(`/comments/${commentId}`);
      setComments(prev => prev.filter(c => c._id !== commentId));
      onCountChange?.(-1);
    } catch {
      setComments(prev => prev);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) return null;

  const modalNode = (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.backdrop} />
      <div className={styles.sheetWrap}>
        <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
          <div className={styles.dragBarWrap}>
            <span className={styles.dragBar} />
          </div>
          <div className={styles.header}>
            <span className={styles.title}>评论</span>
            <button className={styles.closeBtn} onClick={onClose}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className={styles.list}>
            {loading ? (
              <div className={styles.loadingState}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" strokeDasharray="36 18" />
                </svg>
                <span className={styles.loadingText}>加载评论中...</span>
              </div>
            ) : comments.length === 0 ? (
              <div className={styles.emptyComment}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                <span className={styles.emptyCommentText}>暂无评论，快来抢沙发</span>
              </div>
            ) : (
              comments.map(c => {
                const initial = c.nickname ? c.nickname.charAt(0).toUpperCase() : 'U';
                const canDelete = !!c.canDelete || (user && c.user?.toString() === user._id);
                return (
                  <div key={c._id} className={styles.commentItem}>
                    <div className={styles.commentAvatar}>{initial}</div>
                    <div className={styles.commentBody}>
                      <div className={styles.commentHeader}>
                        <div className={styles.commentName}>{c.nickname || '校园用户'}</div>
                        {canDelete && (
                          <button className={styles.deleteBtn} onClick={() => handleDelete(c._id)} title="删除评论">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <div className={styles.commentText}>{c.content}</div>
                      <div className={styles.commentTime}>{timeAgo(c.createdAt)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className={styles.inputBar} onClick={(e) => e.stopPropagation()}>
            <input
              className={styles.input}
              placeholder="写评论..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={200}
            />
            <button
              className={styles.sendBtn}
              disabled={!text.trim() || sending || loading}
              onClick={handleSend}
            >
              {sending ? '...' : '发送'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}

export default CommentModal;
