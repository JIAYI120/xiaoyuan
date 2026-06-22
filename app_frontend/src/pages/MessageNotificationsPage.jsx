import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import styles from './MessageNotifications.module.css';

const filterTabs = [
  { key: 'all', label: '全部' },
  { key: 'like', label: '点赞互动' },
  { key: 'comment', label: '评论互动' },
  { key: 'bookmark', label: '收藏互动' },
  { key: 'follow', label: '关注互动' },
];

function MessageNotificationsPage() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, hasMore: false });
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  const fetchNotices = async (targetPage = 1, append = false) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/messages/notifications', {
        params: {
          page: targetPage,
          limit: 20,
        },
      });
      const list = res.data?.list || [];
      const nextPagination = res.data?.pagination || { page: targetPage, limit: 20, total: list.length, hasMore: false };
      setNotices(prev => append ? [...prev, ...list] : list);
      setPagination(nextPagination);
      setPage(nextPagination.page || targetPage);
    } catch {
      if (!append) {
        setNotices([]);
        setPagination({ page: 1, limit: 20, total: 0, hasMore: false });
        setPage(1);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices(1, false);
  }, []);

  useEffect(() => {
    const markAllRead = async () => {
      try {
        await apiClient.patch('/messages/notifications/read-all');
        setNotices(prev => prev.map(item => ({ ...item, isRead: true })));
      } catch {
        setNotices(prev => prev);
      }
    };
    markAllRead();
  }, []);

  const filteredNotices = useMemo(() => {
    const list = activeFilter === 'all'
      ? notices
      : notices.filter(item => item.type === activeFilter);

    return [...list].sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
  }, [activeFilter, notices]);

  const activeLabel = filterTabs.find(tab => tab.key === activeFilter)?.label || '全部';

  const handleLoadMore = () => {
    if (!pagination.hasMore || loading) {
      return;
    }
    fetchNotices(page + 1, true);
  };

  const handleDeleteNotice = async (noticeId) => {
    if (deletingId) {
      return;
    }
    setDeletingId(noticeId);
    try {
      await apiClient.delete(`/messages/notifications/${noticeId}`);
      setNotices(prev => prev.filter(item => item.id !== noticeId));
      setPagination(prev => ({
        ...prev,
        total: Math.max(0, (prev.total || 0) - 1),
      }));
    } catch {
      setNotices(prev => prev);
    } finally {
      setDeletingId('');
    }
  };

  const handleNoticeClick = (item) => {
    if (item.type === 'follow') {
      navigate(`/user/${item.actorId}`);
    } else if (item.postId) {
      navigate(`/post/${item.postId}`);
    }
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
          <div className={styles.headerTitle}>互动通知</div>
          <div className={styles.headerSpacer} />
        </div>

        <div className={styles.filterWrap}>
          <label className={styles.filterLabel}>筛选通知</label>
          <button className={styles.filterTrigger} onClick={() => setFilterOpen(prev => !prev)}>
            <div className={styles.filterValue}>
              <span className={styles.filterChip}>{activeLabel}</span>
            </div>
            <span className={`${styles.filterArrow} ${filterOpen ? styles.filterArrowOpen : ''}`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </button>

          {filterOpen && (
            <div className={styles.filterPanel}>
              {filterTabs.map(tab => {
                const active = activeFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    className={`${styles.filterOption} ${active ? styles.filterOptionActive : ''}`}
                    onClick={() => {
                      setActiveFilter(tab.key);
                      setFilterOpen(false);
                    }}
                  >
                    <span className={styles.filterOptionMain}>
                      <span className={styles.filterOptionDot} />
                      <span className={styles.filterOptionText}>{tab.label}</span>
                    </span>
                    {active && (
                      <span className={styles.filterOptionCheck}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.list}>
          {filteredNotices.length ? (
            <div className={styles.noticeList}>
              {filteredNotices.map(item => (
                <div
                  key={item.id}
                  className={styles.noticeItem}
                  onClick={() => handleNoticeClick(item)}
                  style={{ cursor: (item.type === 'follow' || item.postId) ? 'pointer' : 'default' }}
                >
                  <div className={styles.avatar}>{item.avatarText || item.title?.charAt(0)?.toUpperCase() || '互'}</div>
                  <div className={styles.noticeMain}>
                    <div className={styles.noticeTop}>
                      <span className={styles.noticeTitle}>{item.title}</span>
                      <div className={styles.noticeMeta}>
                        <span className={styles.noticeTime}>{item.time}</span>
                        <button
                          className={styles.noticeDeleteBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotice(item.id);
                          }}
                          disabled={deletingId === item.id}
                        >
                          {deletingId === item.id ? '删除中' : '删除'}
                        </button>
                      </div>
                    </div>
                    <p className={styles.noticeDesc}>{item.desc}</p>
                  </div>
                  {!item.isRead && <span className={styles.dot} />}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>暂无互动记录</div>
          )}

          {pagination.hasMore && (
            <button className={styles.loadMoreBtn} onClick={handleLoadMore} disabled={loading}>
              {loading ? '加载中...' : '加载更多'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessageNotificationsPage;
