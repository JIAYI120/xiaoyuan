import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Modal from '../components/Modal';
import apiClient from '../api/axios';
import styles from './ChatInfo.module.css';

function ItemArrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function MomentsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="13" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="17" cy="10" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function Switch({ checked, onChange, disabled }) {
  return (
    <button type="button" className={`${styles.switchBtn} ${checked ? styles.switchOn : ''}`} onClick={onChange} disabled={disabled}>
      <span className={`${styles.switchThumb} ${checked ? styles.switchThumbOn : ''}`} />
    </button>
  );
}

function ChatInfoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const initialConversation = location.state?.conversation;
  const [info, setInfo] = useState({
    conversationId: initialConversation?.id || '',
    user: {
      _id: initialConversation?.userId || id,
      nickname: initialConversation?.nickname || '聊天对象',
    },
    isPinned: Boolean(initialConversation?.isPinned),
    isMuted: Boolean(initialConversation?.isMuted),
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchInfo = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/messages/conversation-detail/${id}`);
      setInfo(prev => ({ ...prev, ...(res.data || {}) }));
    } catch {
      setInfo(prev => prev);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  const profileTargetId = info.user?._id || id;
  const conversationId = info.conversationId;

  const items = useMemo(() => ([
    {
      key: 'profile',
      icon: <MomentsIcon />,
      label: '好友个人主页',
      action: () => navigate(`/user/${profileTargetId}`),
    },
    {
      key: 'search',
      icon: <SearchIcon />,
      label: '查找聊天记录',
      action: () => navigate(`/messages/${id}/search`, {
        state: {
          conversation: {
            id: conversationId,
            userId: profileTargetId,
            nickname: info.user?.nickname,
          },
        },
      }),
    },
  ]), [navigate, profileTargetId, id, conversationId, info.user?.nickname]);

  const toggleMute = async () => {
    if (!conversationId || submitting) {
      return;
    }
    setSubmitting('mute');
    const nextMuted = !info.isMuted;
    setInfo(prev => ({ ...prev, isMuted: nextMuted }));
    try {
      const res = await apiClient.patch(`/messages/conversations/${conversationId}/mute`);
      setInfo(prev => ({ ...prev, isMuted: Boolean(res.data?.isMuted) }));
    } catch {
      setInfo(prev => ({ ...prev, isMuted: !nextMuted }));
    } finally {
      setSubmitting('');
    }
  };

  const togglePin = async () => {
    if (!conversationId || submitting) {
      return;
    }
    setSubmitting('pin');
    const nextPinned = !info.isPinned;
    setInfo(prev => ({ ...prev, isPinned: nextPinned }));
    try {
      const res = await apiClient.patch(`/messages/conversations/${conversationId}/pin`);
      setInfo(prev => ({ ...prev, isPinned: Boolean(res.data?.isPinned) }));
    } catch {
      setInfo(prev => ({ ...prev, isPinned: !nextPinned }));
    } finally {
      setSubmitting('');
    }
  };

  const confirmDelete = async () => {
    if (!conversationId || submitting) {
      return;
    }

    setSubmitting('delete');
    setDeleteError('');
    try {
      await apiClient.delete(`/messages/conversations/${conversationId}`);
      navigate('/?tab=message', { replace: true });
    } catch (err) {
      setDeleteError(err.response?.data?.msg || '删除聊天失败');
    } finally {
      setSubmitting('');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.phoneFrame}>
        <div className={styles.header}>
          <button className={styles.closeBtn} onClick={() => navigate(-1)}>
            ×
          </button>
          <div className={styles.title}>聊天信息</div>
          <div className={styles.headerSpace} />
        </div>

        <div className={styles.content}>
          {loading ? <div className={styles.loading}>加载中...</div> : null}

          {items.map(item => (
            <button key={item.key} className={styles.rowBtn} onClick={item.action}>
              <span className={styles.rowIcon}>{item.icon}</span>
              <span className={styles.rowLabel}>{item.label}</span>
              <span className={styles.rowArrow}><ItemArrow /></span>
            </button>
          ))}

          <div className={styles.rowStatic}>
            <span className={styles.rowIcon}><BellIcon /></span>
            <span className={styles.rowLabel}>消息免打扰</span>
            <Switch checked={info.isMuted} onChange={toggleMute} disabled={submitting === 'mute'} />
          </div>

          <div className={styles.rowStatic}>
            <span className={styles.rowIcon}><StarIcon /></span>
            <span className={styles.rowLabel}>置顶聊天</span>
            <Switch checked={info.isPinned} onChange={togglePin} disabled={submitting === 'pin'} />
          </div>

          <button className={`${styles.rowBtn} ${styles.dangerRow}`} onClick={() => { setDeleteError(''); setDeleteOpen(true); }}>
            <span className={`${styles.rowIcon} ${styles.dangerIcon}`}><TrashIcon /></span>
            <span className={styles.dangerLabel}>删除聊天记录</span>
          </button>
        </div>
      </div>

      <Modal open={deleteOpen} onClose={() => (submitting === 'delete' ? null : setDeleteOpen(false))} title="删除聊天记录" hideFooter hideCloseButton>
        <div className={styles.deleteModalContent}>
          <p className={styles.deleteModalText}>确认删除与“{info.user?.nickname || '该好友'}”的聊天记录？</p>
          <p className={styles.deleteModalDesc}>删除后当前账号聊天记录会被清空。</p>
          {deleteError ? <p className={styles.deleteModalError}>{deleteError}</p> : null}
          <div className={styles.deleteModalActions}>
            <button type="button" className={styles.deleteModalCancel} onClick={() => setDeleteOpen(false)} disabled={submitting === 'delete'}>
              取消
            </button>
            <button type="button" className={styles.deleteModalConfirm} onClick={confirmDelete} disabled={submitting === 'delete'}>
              {submitting === 'delete' ? '删除中...' : '确认删除'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ChatInfoPage;
