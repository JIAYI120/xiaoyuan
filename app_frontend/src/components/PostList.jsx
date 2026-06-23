import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import styles from '../pages/MyPosts.module.css';

function formatPostTime(dateStr) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function renderPostMeta(post) {
  const timeText = formatPostTime(post.createdAt);
  if (post.topic) {
    return `${timeText} · #${post.topic}`;
  }
  return timeText;
}

function TruncatedContent({ text, postId }) {
  const navigate = useNavigate();
  
  return (
    <div className={styles.postContent}>
      <span style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {text}
      </span>
      <button className={styles.viewDetailBtn} onClick={() => navigate(`/post/${postId}`)}>
        查看详细
      </button>
    </div>
  );
}

function PostCard({ post, onLike, onBookmark, onDelete }) {
  const initial = post.nickname ? post.nickname.charAt(0).toUpperCase() : 'U';

  return (
    <div className={styles.postCard}>
      <div className={styles.postHeader}>
        <div className={styles.postAvatar}>{initial}</div>
        <div className={styles.postUser}>
          <div className={styles.postName}>{post.nickname || '校园用户'}</div>
          <div className={styles.postTime}>{renderPostMeta(post)}</div>
        </div>
        {onDelete && (
          <button className={styles.deleteBtn} onClick={() => onDelete(post._id)} title="删除">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        )}
      </div>
      <TruncatedContent text={post.content} postId={post._id} />
      {post.images && post.images.length > 0 && (
        <div className={styles.postImages}>
          {post.images.map((img, idx) => (
            <div key={idx} className={styles.postImage}>
              <img src={img} alt="" />
            </div>
          ))}
        </div>
      )}
      <div className={styles.postActions}>
        <span className={styles.actionBtn}>
          <span className={styles.actionIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </span>
          {post.commentCount || 0}
        </span>
        <button
          className={`${styles.actionBtn} ${post.liked ? styles.liked : ''}`}
          onClick={() => onLike(post._id)}
        >
          <span className={styles.actionIcon}>
            {post.liked ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            )}
          </span>
          {post.likeCount || 0}
        </button>
        <button
          className={`${styles.actionBtn} ${post.bookmarked ? styles.bookmarked : ''}`}
          onClick={() => onBookmark(post._id)}
        >
          <span className={styles.actionIcon}>
            {post.bookmarked ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.8">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            )}
          </span>
          {post.bookmarkCount || 0}
        </button>
      </div>
    </div>
  );
}

function PostList({ apiEndpoint, emptyText, emptyIcon, enableDelete = false }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(apiEndpoint);
      const list = res.data;
      if (list.length > 0) {
        const ids = list.map(p => p._id).join(',');
        try {
          const [likeRes, bookmarkRes] = await Promise.all([
            apiClient.get(`/likes/status?posts=${ids}`),
            apiClient.get(`/bookmarks/status?posts=${ids}`),
          ]);
          list.forEach(p => {
            p.liked = !!likeRes.data[p._id];
            p.bookmarked = !!bookmarkRes.data[p._id];
          });
        } catch {
          list.forEach(p => {
            p.liked = false;
            p.bookmarked = false;
          });
        }
      }
      setPosts(list);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleLike = useCallback((postId) => {
    setPosts(prev => {
      const target = prev.find(p => p._id === postId);
      if (!target) return prev;
      const liked = !target.liked;
      if (liked) {
        apiClient.post(`/likes/${postId}`).catch(() => null);
      } else {
        apiClient.delete(`/likes/${postId}`).catch(() => null);
      }
      return prev.map(p => p._id === postId ? { ...p, liked, likeCount: liked ? (p.likeCount || 0) + 1 : Math.max(0, (p.likeCount || 1) - 1) } : p);
    });
  }, []);

  const handleBookmark = useCallback((postId) => {
    setPosts(prev => {
      const target = prev.find(p => p._id === postId);
      if (!target) return prev;
      const bookmarked = !target.bookmarked;
      if (bookmarked) {
        apiClient.post(`/bookmarks/${postId}`).catch(() => null);
      } else {
        apiClient.delete(`/bookmarks/${postId}`).catch(() => null);
      }
      return prev.map(p => p._id === postId ? { ...p, bookmarked, bookmarkCount: bookmarked ? (p.bookmarkCount || 0) + 1 : Math.max(0, (p.bookmarkCount || 1) - 1) } : p);
    });
  }, []);

  const handleDelete = useCallback(async (postId) => {
    try {
      await apiClient.delete(`/posts/${postId}`);
      setPosts(prev => prev.filter(p => p._id !== postId));
    } catch {
      setPosts(prev => prev);
    }
  }, []);



  return (
    <>
      <div className={styles.body}>
        {loading ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className={styles.emptyText}>加载中...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>{emptyIcon}</div>
            <span className={styles.emptyText}>{emptyText}</span>
            <button className={styles.retryBtn} onClick={fetchPosts}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
              </svg>
              刷新
            </button>
          </div>
        ) : (
          <div className={styles.postList}>
            {posts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                onLike={handleLike}
                onBookmark={handleBookmark}
                onDelete={enableDelete ? handleDelete : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default PostList;