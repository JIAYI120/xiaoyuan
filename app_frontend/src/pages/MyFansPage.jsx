import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import styles from './MyFans.module.css';

function UserItem({ user, onFollow, onAvatarClick }) {
  const initial = user.nickname ? user.nickname.charAt(0).toUpperCase() : 'U';

  return (
    <div className={styles.userItem}>
      <div className={styles.userAvatar} onClick={() => onAvatarClick?.(user._id)} style={{ cursor: 'pointer' }}>{initial}</div>
      <div className={styles.userInfo}>
        <div className={styles.userName}>{user.nickname || '校园用户'}</div>
        <span className={styles.userTag}>{user.identity || '学生'}</span>
      </div>
      <button
        className={`${styles.actionBtn} ${user.mutual ? styles.mutual : styles.followBack}`}
        onClick={(e) => { e.stopPropagation(); onFollow(user._id); }}
      >
        {user.mutual ? '已互关' : '回关'}
      </button>
    </div>
  );
}

function MyFansPage() {
  const navigate = useNavigate();
  const [fans, setFans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient.get('/follow/fans')
      .then(res => setFans(res.data))
      .catch(() => setFans([]))
      .finally(() => setLoading(false));
  }, []);

  const handleFollow = useCallback(async (userId) => {
    const target = fans.find(u => u._id === userId);
    if (!target) return;
    if (target.mutual) {
      try {
        await apiClient.delete(`/follow/${userId}`);
        setFans(prev => prev.map(u => u._id === userId ? { ...u, mutual: false } : u));
      } catch {
        setFans(prev => prev);
      }
    } else {
      try {
        await apiClient.post(`/follow/${userId}`);
        setFans(prev => prev.map(u => u._id === userId ? { ...u, mutual: true } : u));
      } catch {
        setFans(prev => prev);
      }
    }
  }, [fans]);

  return (
    <div className={styles.page}>
      <div className={styles.phoneFrame}>
        <div className={styles.navBar}>
          <div className={styles.navLeft}>
            <button className={styles.backBtn} onClick={() => navigate('/?tab=mine', { replace: true })}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </div>
          <span className={styles.navTitle}>我的粉丝</span>
          <div className={styles.navRight} />
        </div>

        <div className={styles.body}>
          {loading ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyText}>加载中...</span>
            </div>
          ) : fans.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <span className={styles.emptyText}>暂无粉丝</span>
            </div>
          ) : (
            <div className={styles.userList}>
              {fans.map(user => (
                <UserItem key={user._id} user={user} onFollow={handleFollow} onAvatarClick={(uid) => navigate(`/user/${uid}`)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyFansPage;
