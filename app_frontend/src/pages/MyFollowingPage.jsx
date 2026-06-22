import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import styles from './MyFollowing.module.css';

function UserItem({ user, onToggle, onAvatarClick }) {
  const initial = user.nickname ? user.nickname.charAt(0).toUpperCase() : 'U';

  return (
    <div className={styles.userItem}>
      <div className={styles.userAvatar} onClick={() => onAvatarClick?.(user._id)} style={{ cursor: 'pointer' }}>{initial}</div>
      <div className={styles.userInfo}>
        <div className={styles.userName}>{user.nickname || '校园用户'}</div>
        <span className={styles.userTag}>{user.identity || '学生'}</span>
      </div>
      <button
        className={`${styles.followBtn} ${user.isFollowing ? styles.following : styles.follow}`}
        onClick={(e) => { e.stopPropagation(); onToggle(user._id); }}
      >
        {user.isFollowing ? '已关注' : '关注'}
      </button>
    </div>
  );
}

function MyFollowingPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient.get('/follow/following')
      .then(res => setUsers(res.data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = useCallback(async (userId) => {
    const target = users.find(u => u._id === userId);
    if (!target) return;
    if (target.isFollowing) {
      try {
        await apiClient.delete(`/follow/${userId}`);
        setUsers(prev => prev.filter(u => u._id !== userId));
      } catch {
        setUsers(prev => prev);
      }
    } else {
      try {
        await apiClient.post(`/follow/${userId}`);
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, isFollowing: true } : u));
      } catch {
        setUsers(prev => prev);
      }
    }
  }, [users]);

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
          <span className={styles.navTitle}>我的关注</span>
          <div className={styles.navRight} />
        </div>

        <div className={styles.body}>
          {loading ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyText}>加载中...</span>
            </div>
          ) : users.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </div>
              <span className={styles.emptyText}>暂未关注任何人</span>
            </div>
          ) : (
            <div className={styles.userList}>
              {users.map(user => (
                <UserItem key={user._id} user={user} onToggle={handleToggle} onAvatarClick={(uid) => navigate(`/user/${uid}`)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyFollowingPage;
