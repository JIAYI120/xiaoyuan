import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import apiClient from '../api/axios';
import { formatTime } from '../utils/time';
import styles from './Messages.module.css';

function SettingIcon({ hasDot }) {
  return (
    <div className={styles.settingWrap}>
      <button className={styles.settingBtn}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 008.45 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 8.45a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      </button>
      {hasDot && <span className={styles.settingDot} />}
    </div>
  );
}

function ConversationItem({ item, onOpen, onDelete, deleting }) {
  const displayTime = item.time || formatTime(item.updatedAt || item.lastMessageAt);
  return (
    <div className={`${styles.sessionItem} ${item.isPinned ? styles.sessionPinned : ''}`}>
      <button className={styles.sessionMainBtn} onClick={() => onOpen(item)}>
        <div className={styles.avatarWrap}>
          <div className={styles.avatar}>{item.avatarText}</div>
          {item.unreadCount > 0 && <span className={`${styles.avatarUnreadDot} ${item.isMuted ? styles.avatarMutedDot : ''}`} />}
        </div>
        <div className={styles.sessionMain}>
          <div className={styles.sessionTop}>
            <div className={styles.sessionNameRow}>
              <span className={styles.sessionName}>{item.nickname}</span>
              {item.isPinned && <span className={styles.pinTag}>置顶</span>}
            </div>
            <span className={styles.sessionTime}>{displayTime}</span>
          </div>
          <div className={styles.sessionBottom}>
            <p className={styles.sessionText}>{item.lastMessage}</p>
          </div>
        </div>
      </button>
      <button
        type="button"
        className={styles.deleteBtnStandalone}
        onClick={() => onDelete(item)}
        disabled={deleting}
        aria-label="删除聊天"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </button>
    </div>
  );
}

function MessagesPage() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [summary, setSummary] = useState({ interactionUnreadCount: 0, dmUnreadCount: 0 });
  const [deletingId, setDeletingId] = useState('');
  const [pendingDeleteItem, setPendingDeleteItem] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [conversationRes, summaryRes] = await Promise.all([
        apiClient.get('/messages/conversations'),
        apiClient.get('/messages/summary'),
      ]);
      setConversations(conversationRes.data || []);
      setSummary(summaryRes.data || { interactionUnreadCount: 0, dmUnreadCount: 0 });
    } catch {
      setConversations([]);
      setSummary({ interactionUnreadCount: 0, dmUnreadCount: 0 });
    }
  }, []);

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }, [conversations]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      fetchData();
    }, 3000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };

    window.addEventListener('focus', fetchData);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', fetchData);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData]);

  const hasInteractiveUnread = summary.interactionUnreadCount > 0;

  const handleOpenConversation = (item) => {
    navigate(`/messages/${item.userId}`, {
      state: {
        conversation: item,
      },
    });
  };

  const handleDeleteConversation = (item) => {
    if (deletingId) {
      return;
    }
    setDeleteError('');
    setPendingDeleteItem(item);
  };

  const confirmDeleteConversation = async () => {
    if (!pendingDeleteItem || deletingId) {
      return;
    }

    setDeletingId(pendingDeleteItem.id);
    setDeleteError('');
    try {
      await apiClient.delete(`/messages/conversations/${pendingDeleteItem.id}`);
      setConversations(prev => prev.filter(conv => conv.id !== pendingDeleteItem.id));
      setSummary(prev => ({
        ...prev,
        dmUnreadCount: Math.max(0, (prev.dmUnreadCount || 0) - (pendingDeleteItem.unreadCount || 0)),
      }));
      setPendingDeleteItem(null);
    } catch (err) {
      setDeleteError(err.response?.data?.msg || '删除聊天失败');
    } finally {
      setDeletingId('');
    }
  };

  const closeDeleteModal = () => {
    if (deletingId) {
      return;
    }
    setDeleteError('');
    setPendingDeleteItem(null);
  };

  return (
    <div className={styles.pageWrap}>
      <div className={styles.content}>
        <button className={styles.noticeCard} onClick={() => navigate('/messages/notifications')}>
          <div className={styles.noticeIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </div>
          <div className={styles.noticeBody}>
            <div className={styles.noticeTitle}>互动提示</div>
            <div className={styles.noticeDesc}>点赞、评论、收藏和关注提醒统一查看</div>
          </div>
          {hasInteractiveUnread && <span className={styles.noticeDot} />}
          <span className={styles.noticeArrow}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        </button>

        <div className={styles.sectionTitle}>全部私信</div>

        <div className={styles.sessionList}>
          {sortedConversations.map(item => (
            <ConversationItem
              key={item.id}
              item={item}
              onOpen={handleOpenConversation}
              onDelete={handleDeleteConversation}
              deleting={deletingId === item.id}
            />
          ))}
        </div>
      </div>

      <Modal open={Boolean(pendingDeleteItem)} onClose={closeDeleteModal} title="删除聊天" hideFooter hideCloseButton>
        <div className={styles.deleteModalContent}>
          <p className={styles.deleteModalText}>
            {pendingDeleteItem ? `确定删除与“${pendingDeleteItem.nickname}”的聊天吗？` : ''}
          </p>
          <p className={styles.deleteModalDesc}>删除后聊天记录会被清空。</p>
          {deleteError ? <p className={styles.deleteModalError}>{deleteError}</p> : null}
          <div className={styles.deleteModalActions}>
            <button type="button" className={styles.deleteModalCancel} onClick={closeDeleteModal} disabled={Boolean(deletingId)}>
              取消
            </button>
            <button type="button" className={styles.deleteModalConfirm} onClick={confirmDeleteConversation} disabled={Boolean(deletingId)}>
              {deletingId ? '删除中...' : '确认删除'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default MessagesPage;
