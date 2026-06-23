import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePostState } from '../context/PostStateContext';
import apiClient from '../api/axios';
import PublishModal from '../components/PublishModal';
import MessagesPage from './MessagesPage';
import styles from './Dashboard.module.css';
import postStyles from './MyPosts.module.css';

const tabs = [
  { key: 'home', label: '首页' },
  { key: 'friends', label: '朋友' },
  { key: 'publish', label: '' },
  { key: 'message', label: '消息' },
  { key: 'mine', label: '我的' },
];

const feedCacheStore = {};
const feedScrollStore = {};
const feedDetailReturnScrollStore = {};

function HomeIcon() {
  return (
    <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <polyline points="9 21 9 14 15 14 15 21" />
    </svg>
  );
}

function FriendsIcon() {
  return (
    <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function MessageIcon({ hasUnread }) {
  return (
    <div style={{ position: 'relative' }}>
      <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
      {hasUnread && <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', backgroundColor: '#FF3B30', border: '2px solid white' }} />}
    </div>
  );
}

function MineIcon() {
  return (
    <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

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

function TruncatedContent({ text, postId, detailState, onViewDetail }) {
  const navigate = useNavigate();
  
  return (
    <div className={postStyles.postContent}>
      <span style={{ 
        display: '-webkit-box', 
        WebkitLineClamp: 3, 
        WebkitBoxOrient: 'vertical', 
        overflow: 'hidden',
        minHeight: '76px',
        lineHeight: '1.7'
      }}>
        {text}
      </span>
      <button className={postStyles.viewDetailBtn} onClick={() => {
        onViewDetail?.();
        navigate(`/post/${postId}`, { state: detailState });
      }}>
        查看详细
      </button>
    </div>
  );
}

function FeedPostCard({ post, onLike, onBookmark, onAvatarClick, isOwn, onDelete, detailState, onViewDetail }) {
  const initial = post.nickname ? post.nickname.charAt(0).toUpperCase() : 'U';

  return (
    <div className={postStyles.postCard}>
      <div className={postStyles.postHeader}>
        <div className={postStyles.postAvatar} onClick={() => onAvatarClick?.(post.user)} style={{ cursor: 'pointer' }}>{initial}</div>
        <div className={postStyles.postUser}>
          <div className={postStyles.postName}>{post.nickname || '校园用户'}</div>
          <div className={postStyles.postTime}>{renderPostMeta(post)}</div>
        </div>
        {isOwn && onDelete && (
          <button className={postStyles.deleteBtn} onClick={(e) => { e.stopPropagation(); onDelete(post._id); }} title="删除">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        )}
      </div>
      <TruncatedContent text={post.content} postId={post._id} detailState={detailState} onViewDetail={onViewDetail} />
      {post.images && post.images.length > 0 && (
        <div className={postStyles.postImages}>
          {post.images.map((img, idx) => (
            <div key={idx} className={postStyles.postImage}>
              <img src={img} alt="" />
            </div>
          ))}
        </div>
      )}
      <div className={postStyles.postActions}>
        <span className={postStyles.actionBtn}>
          <span className={postStyles.actionIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </span>
          {post.commentCount || 0}
        </span>
        <button
          className={`${postStyles.actionBtn} ${post.liked ? postStyles.liked : ''}`}
          onClick={() => onLike(post._id)}
        >
          <span className={postStyles.actionIcon}>
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
          className={`${postStyles.actionBtn} ${post.bookmarked ? postStyles.bookmarked : ''}`}
          onClick={() => onBookmark(post._id)}
        >
          <span className={postStyles.actionIcon}>
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

function SearchUserCard({ user, onClick }) {
  const initial = user.nickname ? user.nickname.charAt(0).toUpperCase() : 'U';

  return (
    <button className={styles.searchUserCard} onClick={() => onClick?.(user._id)}>
      <div className={styles.searchUserAvatar}>{initial}</div>
      <div className={styles.searchUserInfo}>
        <div className={styles.searchUserHeader}>
          <div className={styles.searchUserName}>{user.nickname || '校园用户'}</div>
          {user.username && user.username !== user.nickname && (
            <div className={styles.searchUserAccount}>用户名：{user.username}</div>
          )}
        </div>
        <div className={styles.searchUserMeta}>{user.identity || '学生'}</div>
      </div>
    </button>
  );
}

function PostFeed({ refreshKey, endpoint, emptyTitle, emptyDesc, emptyIcon, active, cachedDataRef, cachedScrollRef, pageClassName, showSearch = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updatedPosts, refreshTriggers } = usePostState();
  const [feed, setFeed] = useState(() => cachedDataRef.current[endpoint] || []);
  const [loading, setLoading] = useState(() => !cachedDataRef.current[endpoint]);
  const [searchText, setSearchText] = useState('');
  const [searchType, setSearchType] = useState('post');
  const [randomPost, setRandomPost] = useState(null);
  const [randomLoading, setRandomLoading] = useState(false);
  const [postSearchResults, setPostSearchResults] = useState([]);
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [hasNewFeed, setHasNewFeed] = useState(false);
  const requestedRef = useRef(false);
  const lastPostIdRef = useRef(null);
  const feedRef = useRef(null);
  const feedCacheRef = useRef(feed);
  const panelRef = useRef(null);
  const restoredScrollRef = useRef(false);
  const ignoreScrollCacheRef = useRef(false);
  const detailReturnScrollRef = useRef(feedDetailReturnScrollStore);

  const fetchFeed = useCallback(async (force = false) => {
    if (!force && cachedDataRef.current[endpoint]?.length) {
      setFeed(cachedDataRef.current[endpoint]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.get(endpoint);
      const posts = res.data;
      if (posts.length > 0) {
        const ids = posts.map(p => p._id).join(',');
        try {
          const [likeRes, bookmarkRes] = await Promise.all([
            apiClient.get(`/likes/status?posts=${ids}`),
            apiClient.get(`/bookmarks/status?posts=${ids}`),
          ]);
          posts.forEach(p => {
            p.liked = !!likeRes.data[p._id];
            p.bookmarked = !!bookmarkRes.data[p._id];
          });
        } catch {
          posts.forEach(p => {
            p.liked = false;
            p.bookmarked = false;
          });
        }
      }
      cachedDataRef.current[endpoint] = posts;
      setFeed(posts);
      if (posts.length > 0) {
        lastPostIdRef.current = posts[0]._id;
      }
    } catch {
      if (!cachedDataRef.current[endpoint]) {
        setFeed([]);
      }
    } finally {
      setLoading(false);
    }
  }, [cachedDataRef, endpoint]);

  const hydratePostStatuses = useCallback(async (posts) => {
    if (!posts.length) {
      return [];
    }
    const nextPosts = posts.map(post => ({ ...post }));
    const ids = nextPosts.map(p => p._id).join(',');
    try {
      const [likeRes, bookmarkRes] = await Promise.all([
        apiClient.get(`/likes/status?posts=${ids}`),
        apiClient.get(`/bookmarks/status?posts=${ids}`),
      ]);
      nextPosts.forEach(p => {
        p.liked = !!likeRes.data[p._id];
        p.bookmarked = !!bookmarkRes.data[p._id];
      });
    } catch {
      nextPosts.forEach(p => {
        p.liked = false;
        p.bookmarked = false;
      });
    }
    return nextPosts;
  }, []);

  useEffect(() => {
    if (!active) {
      return;
    }
    if (!requestedRef.current) {
      requestedRef.current = true;
      fetchFeed();
    }
  }, [active, fetchFeed]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) {
      return undefined;
    }

    const handleScroll = () => {
      if (ignoreScrollCacheRef.current) {
        return;
      }
      cachedScrollRef.current[endpoint] = panel.scrollTop;
    };

    panel.addEventListener('scroll', handleScroll, { passive: true });
    return () => panel.removeEventListener('scroll', handleScroll);
  }, [cachedScrollRef, endpoint]);

  useEffect(() => {
    if (!active) {
      restoredScrollRef.current = false;
      return;
    }

    if (restoredScrollRef.current) {
      return;
    }

    const triggerCount = refreshTriggers[endpoint];
    if (triggerCount && triggerCount > 0) {
      return;
    }

    const hasDetailReturnScroll = Object.prototype.hasOwnProperty.call(detailReturnScrollRef.current, endpoint);
    const detailReturnScrollTop = detailReturnScrollRef.current[endpoint];
    const savedScrollTop = hasDetailReturnScroll
      ? detailReturnScrollTop
      : (cachedScrollRef.current[endpoint] || 0);

    if (!hasDetailReturnScroll && savedScrollTop <= 0) {
      restoredScrollRef.current = true;
      return;
    }

    const timer = window.setTimeout(() => {
      ignoreScrollCacheRef.current = true;
      if (panelRef.current) {
        panelRef.current.scrollTop = savedScrollTop;
      }
      delete detailReturnScrollRef.current[endpoint];
      window.setTimeout(() => {
        ignoreScrollCacheRef.current = false;
      }, 120);
      restoredScrollRef.current = true;
    }, 50);

    return () => window.clearTimeout(timer);
  }, [active, cachedScrollRef, endpoint, feed.length, loading, refreshTriggers]);

  useEffect(() => {
    if (feed.length > 0 && active) {
      lastPostIdRef.current = feed[0]._id;
    }
  }, [feed, active]);

  useEffect(() => {
    if (!active) {
      setHasNewFeed(false);
    }
  }, [active]);

  const checkNewFeed = useCallback(async () => {
    try {
      const res = await apiClient.get(endpoint);
      const newPosts = Array.isArray(res.data) ? res.data : [];
      const currentPosts = cachedDataRef.current[endpoint] || [];

      if (currentPosts.length > 0) {
        const newPostIds = new Set(newPosts.map(post => post._id));
        const hasRemovedPosts = currentPosts.some(post => !newPostIds.has(post._id));
        if (hasRemovedPosts) {
          const hydratedPosts = await hydratePostStatuses(newPosts);
          cachedDataRef.current[endpoint] = hydratedPosts;
          setFeed(hydratedPosts);
          lastPostIdRef.current = hydratedPosts.length > 0 ? hydratedPosts[0]._id : null;
          setHasNewFeed(false);
          return;
        }
      }

      if (!newPosts.length || !lastPostIdRef.current) {
        return;
      }
      const previousTopIndex = newPosts.findIndex(post => post._id === lastPostIdRef.current);
      if (previousTopIndex > 0) {
        setHasNewFeed(true);
      }
    } catch {
      // ignore error
    }
  }, [cachedDataRef, endpoint, hydratePostStatuses]);

  useEffect(() => {
    if (!active) {
      return;
    }

    checkNewFeed();
    const interval = setInterval(checkNewFeed, 10000);

    return () => clearInterval(interval);
  }, [active, checkNewFeed]);

  const handleRefreshNewFeed = async () => {
    setHasNewFeed(false);
    await fetchFeed(true);
    ignoreScrollCacheRef.current = true;
    if (feedRef.current) {
      feedRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    window.setTimeout(() => {
      ignoreScrollCacheRef.current = false;
    }, 500);
  };

  useEffect(() => {
    if (refreshKey > 0 && active) {
      fetchFeed(true);
    }
  }, [refreshKey, active, fetchFeed]);

  useEffect(() => {
    if (!active || !Object.keys(updatedPosts).length) {
      return;
    }

    setFeed(prev => {
      const updated = prev.map(post => {
        const updates = updatedPosts[post._id];
        if (!updates) return post;
        return { ...post, ...updates };
      });
      cachedDataRef.current[endpoint] = updated;
      return updated;
    });

    setPostSearchResults(prev => {
      if (!prev.length) return prev;
      return prev.map(post => {
        const updates = updatedPosts[post._id];
        if (!updates) return post;
        return { ...post, ...updates };
      });
    });
  }, [updatedPosts, active, endpoint, cachedDataRef]);

  useEffect(() => {
    if (!active) return;
    
    const triggerCount = refreshTriggers[endpoint];
    if (triggerCount && triggerCount > 0) {
      const hasDetailReturnScroll = Object.prototype.hasOwnProperty.call(detailReturnScrollRef.current, endpoint);
      const targetScrollTop = hasDetailReturnScroll 
        ? detailReturnScrollRef.current[endpoint] 
        : (panelRef.current?.scrollTop || 0);
      
      fetchFeed(true).then(() => {
        if (panelRef.current) {
          window.setTimeout(() => {
            ignoreScrollCacheRef.current = true;
            panelRef.current.scrollTop = targetScrollTop;
            delete detailReturnScrollRef.current[endpoint];
            window.setTimeout(() => {
              ignoreScrollCacheRef.current = false;
            }, 120);
          }, 50);
        }
      });
    }
  }, [refreshTriggers, endpoint, active, fetchFeed]);

  useEffect(() => {
    feedCacheRef.current = feed;
  }, [feed]);

  useEffect(() => {
    if (!showSearch) {
      return;
    }

    if (searchType === 'random') {
      setRandomLoading(true);
      apiClient.get('/posts/random')
        .then(res => {
          const posts = Array.isArray(res.data) ? res.data : [];
          return hydratePostStatuses(posts.slice(0, 1));
        })
        .then(posts => {
          if (posts[0]) {
            setRandomPost(posts[0]);
          } else if (feedCacheRef.current.length > 0) {
            const randomIndex = Math.floor(Math.random() * feedCacheRef.current.length);
            setRandomPost({ ...feedCacheRef.current[randomIndex] });
          } else {
            setRandomPost(null);
          }
        })
        .catch(() => {
          if (feedCacheRef.current.length > 0) {
            const randomIndex = Math.floor(Math.random() * feedCacheRef.current.length);
            setRandomPost({ ...feedCacheRef.current[randomIndex] });
          } else {
            setRandomPost(null);
          }
        })
        .finally(() => {
          setRandomLoading(false);
        });
      return;
    }

    const keyword = searchText.trim();
    if (!keyword) {
      setPostSearchResults([]);
      setUserSearchResults([]);
      setSearching(false);
      setSearched(false);
      return;
    }

    let cancelled = false;
    setSearching(true);

    const timer = setTimeout(async () => {
      try {
        if (searchType === 'user') {
          const res = await apiClient.get(`/users/search?q=${encodeURIComponent(keyword)}`);
          if (!cancelled) {
            setUserSearchResults(Array.isArray(res.data) ? res.data : []);
            setPostSearchResults([]);
            setSearched(true);
          }
        } else {
          const res = await apiClient.get(`/posts/search?q=${encodeURIComponent(keyword)}`);
          const posts = await hydratePostStatuses(Array.isArray(res.data) ? res.data : []);
          if (!cancelled) {
            setPostSearchResults(posts);
            setUserSearchResults([]);
            setSearched(true);
          }
        }
      } catch {
        if (!cancelled) {
          setPostSearchResults([]);
          setUserSearchResults([]);
          setSearched(true);
        }
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [hydratePostStatuses, searchText, searchType, showSearch]);

  const updateFeed = useCallback((updater) => {
    setFeed(prev => {
      const next = updater(prev);
      cachedDataRef.current[endpoint] = next;
      lastPostIdRef.current = next.length > 0 ? next[0]._id : null;
      return next;
    });
    setPostSearchResults(prev => updater(prev));
  }, [cachedDataRef, endpoint]);

  const handleLike = useCallback((postId) => {
    updateFeed(prev => {
      const target = prev.find(p => p._id === postId);
      if (!target) return prev;
      const liked = !target.liked;
      const likeCount = liked ? (target.likeCount || 0) + 1 : Math.max(0, (target.likeCount || 1) - 1);
      if (liked) {
        apiClient.post(`/likes/${postId}`).catch(() => null);
      } else {
        apiClient.delete(`/likes/${postId}`).catch(() => null);
      }
      return prev.map(p => p._id === postId ? { ...p, liked, likeCount } : p);
    });
    
    setRandomPost(prev => {
      if (!prev || prev._id !== postId) return prev;
      const currentLiked = !prev.liked;
      const currentLikeCount = currentLiked ? (prev.likeCount || 0) + 1 : Math.max(0, (prev.likeCount || 1) - 1);
      return { ...prev, liked: currentLiked, likeCount: currentLikeCount };
    });
  }, [updateFeed]);

  const handleBookmark = useCallback((postId) => {
    updateFeed(prev => {
      const target = prev.find(p => p._id === postId);
      if (!target) return prev;
      const bookmarked = !target.bookmarked;
      const bookmarkCount = bookmarked ? (target.bookmarkCount || 0) + 1 : Math.max(0, (target.bookmarkCount || 1) - 1);
      if (bookmarked) {
        apiClient.post(`/bookmarks/${postId}`).catch(() => null);
      } else {
        apiClient.delete(`/bookmarks/${postId}`).catch(() => null);
      }
      return prev.map(p => p._id === postId ? { ...p, bookmarked, bookmarkCount } : p);
    });
    
    setRandomPost(prev => {
      if (!prev || prev._id !== postId) return prev;
      const currentBookmarked = !prev.bookmarked;
      const currentBookmarkCount = currentBookmarked ? (prev.bookmarkCount || 0) + 1 : Math.max(0, (prev.bookmarkCount || 1) - 1);
      return { ...prev, bookmarked: currentBookmarked, bookmarkCount: currentBookmarkCount };
    });
  }, [updateFeed]);

  const handleDelete = useCallback(async (postId) => {
    try {
      await apiClient.delete(`/posts/${postId}`);
      updateFeed(prev => prev.filter(p => p._id !== postId));
      setHasNewFeed(false);
    } catch {
      setFeed(prev => prev);
      setPostSearchResults(prev => prev);
    }
  }, [updateFeed]);

  const handleViewDetail = useCallback(() => {
    const panel = panelRef.current;
    detailReturnScrollRef.current[endpoint] = panel ? panel.scrollTop : 0;
  }, [endpoint]);

  const isSearchMode = showSearch && !!searchText.trim();
  const isUserSearchMode = showSearch && searchType === 'user';
  const isRandomMode = showSearch && searchType === 'random';
  const displayedPosts = isSearchMode && searchType === 'post' ? postSearchResults : feed;
  const detailState = {
    fromDashboard: true,
    feedEndpoint: endpoint,
  };
  const displayedUsers = isSearchMode && searchType === 'user' ? userSearchResults : [];
  const showUserSearchPrompt = isUserSearchMode && !isSearchMode && !loading;
  const showPostEmptyState = !loading && !searching && !isUserSearchMode && !isRandomMode && displayedPosts.length === 0;
  const showUserEmptyState = !loading && !searching && isSearchMode && searchType === 'user' && displayedUsers.length === 0;
  const showRandomEmptyState = !randomLoading && isRandomMode && !randomPost;

  return (
    <div ref={panelRef} className={`${styles.pagePanel} ${pageClassName || ''} ${active ? styles.pagePanelActive : styles.pagePanelHidden}`.trim()}>
      {showSearch && (
        <div className={styles.searchBarWrap}>
          <div className={styles.searchTypeSwitch}>
            <button
              className={`${styles.searchTypeBtn} ${searchType === 'post' ? styles.searchTypeBtnActive : ''}`}
              onClick={() => setSearchType('post')}
            >
              帖子
            </button>
            <button
              className={`${styles.searchTypeBtn} ${searchType === 'random' ? styles.searchTypeBtnActive : ''}`}
              onClick={() => setSearchType('random')}
            >
              随看
            </button>
            <button
              className={`${styles.searchTypeBtn} ${searchType === 'user' ? styles.searchTypeBtnActive : ''}`}
              onClick={() => setSearchType('user')}
            >
              用户
            </button>
          </div>
          {searchType !== 'random' && (
            <div className={styles.searchBar}>
              <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className={styles.searchInput}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={searchType === 'user' ? '搜索用户名或昵称' : '搜索相关内容帖子'}
                maxLength={40}
              />
              {searchText && (
                <button className={styles.searchClearBtn} onClick={() => setSearchText('')}>
                  取消
                </button>
              )}
            </div>
          )}
          {hasNewFeed && (
            <div className={styles.newFeedNotification} onClick={handleRefreshNewFeed}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
              </svg>
              <span>有新动态，点击刷新</span>
            </div>
          )}
        </div>
      )}

      <div ref={feedRef}></div>

      {isRandomMode && randomLoading ? (
        <div className={styles.tabContent}>
          <div className={styles.emptyIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <p className={styles.emptyTitle}>正在随机推荐...</p>
        </div>
      ) : isRandomMode && randomPost ? (
        <div className={styles.randomCardContainer}>
          <div className={styles.randomCard}>
            <div className={styles.randomHeader}>
              <span className={styles.randomTitle}>随看</span>
              <button
                className={styles.randomRefreshBtn}
                onClick={() => {
                  setRandomLoading(true);
                  apiClient.get('/posts/random')
                    .then(res => {
                      const posts = Array.isArray(res.data) ? res.data : [];
                      return hydratePostStatuses(posts.slice(0, 1));
                    })
                    .then(posts => {
                      if (posts[0]) {
                        setRandomPost(posts[0]);
                      } else if (feedCacheRef.current.length > 0) {
                        const randomIndex = Math.floor(Math.random() * feedCacheRef.current.length);
                        setRandomPost({ ...feedCacheRef.current[randomIndex] });
                      } else {
                        setRandomPost(null);
                      }
                    })
                    .catch(() => {
                      if (feedCacheRef.current.length > 0) {
                        const randomIndex = Math.floor(Math.random() * feedCacheRef.current.length);
                        setRandomPost({ ...feedCacheRef.current[randomIndex] });
                      } else {
                        setRandomPost(null);
                      }
                    })
                    .finally(() => {
                      setRandomLoading(false);
                    });
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                </svg>
              </button>
            </div>
            <FeedPostCard
              post={randomPost}
              onLike={handleLike}
              onBookmark={handleBookmark}
              onAvatarClick={(userId) => navigate(`/user/${userId}`)}
              isOwn={false}
              detailState={detailState}
              onViewDetail={handleViewDetail}
            />
          </div>
        </div>
      ) : isRandomMode && showRandomEmptyState ? (
        <div className={styles.tabContent}>
          <div className={styles.emptyIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <p className={styles.emptyTitle}>暂无随看内容</p>
          <p className={styles.emptyDesc}>换一批试试</p>
        </div>
      ) : loading ? (
        <div className={styles.tabContent}>
          <div className={styles.emptyIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <p className={styles.emptyTitle}>加载中...</p>
        </div>
      ) : searching ? (
        <div className={styles.tabContent}>
          <div className={styles.emptyIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <p className={styles.emptyTitle}>搜索中...</p>
        </div>
      ) : showRandomEmptyState ? (
        <div className={styles.tabContent}>
          <div className={styles.emptyIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <p className={styles.emptyTitle}>暂无随看内容</p>
          <p className={styles.emptyDesc}>换一批试试</p>
        </div>
      ) : showUserSearchPrompt ? (
        <div className={styles.tabContent}>
          <div className={styles.emptyIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0116 0" />
            </svg>
          </div>
          <p className={styles.emptyTitle}>搜索用户</p>
          <p className={styles.emptyDesc}>输入用户名或昵称，查找你想找的人</p>
        </div>
      ) : showUserEmptyState ? (
        <div className={styles.tabContent}>
          <div className={styles.emptyIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0116 0" />
            </svg>
          </div>
          <p className={styles.emptyTitle}>没有找到相关用户</p>
          <p className={styles.emptyDesc}>{`试试其他关键词${searched ? '，当前支持按用户名和昵称搜索' : ''}`}</p>
        </div>
      ) : searchType === 'user' && isSearchMode ? (
        <div className={styles.searchUserList}>
          {displayedUsers.map(item => (
            <SearchUserCard key={item._id} user={item} onClick={(userId) => navigate(`/user/${userId}`)} />
          ))}
        </div>
      ) : showPostEmptyState ? (
        <div className={styles.tabContent}>
          <div className={styles.emptyIcon}>{emptyIcon}</div>
          <p className={styles.emptyTitle}>{isSearchMode ? '没有找到相关帖子' : emptyTitle}</p>
          <p className={styles.emptyDesc}>{isSearchMode ? `试试其他关键词${searched ? '，搜索内容会匹配正文和话题' : ''}` : emptyDesc}</p>
          {!isSearchMode && (
            <button className={styles.retryBtn} onClick={() => fetchFeed(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
              </svg>
              刷新
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={postStyles.postList}>
            {displayedPosts.map(post => (
              <FeedPostCard
                key={post._id}
                post={post}
                onLike={handleLike}
                onBookmark={handleBookmark}
                onAvatarClick={(userId) => navigate(`/user/${userId}`)}
                isOwn={user && post.user === user._id}
                onDelete={handleDelete}
                detailState={detailState}
                onViewDetail={handleViewDetail}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function HomeFeed({ refreshKey, active, cachedDataRef, cachedScrollRef }) {
  return (
    <PostFeed
      refreshKey={refreshKey}
      endpoint="/posts/feed"
      emptyTitle="暂无动态"
      emptyDesc="快去发布第一条校园动态吧"
      active={active}
      cachedDataRef={cachedDataRef}
      cachedScrollRef={cachedScrollRef}
      pageClassName={styles.pagePanelHome}
      showSearch
      emptyIcon={
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
          <polyline points="9 21 9 14 15 14 15 21" />
        </svg>
      }
    />
  );
}

function FriendsFeed({ refreshKey, active, cachedDataRef, cachedScrollRef }) {
  return (
    <PostFeed
      refreshKey={refreshKey}
      endpoint="/posts/friends"
      emptyTitle="暂无朋友动态"
      emptyDesc="互相关注后，就可以在这里看到朋友发布的帖子"
      active={active}
      cachedDataRef={cachedDataRef}
      cachedScrollRef={cachedScrollRef}
      pageClassName={styles.pagePanelFriends}
      emptyIcon={
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      }
    />
  );
}

function PageContent({ tab, active }) {
  const configs = {
    message: {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      ),
      title: '暂无新消息',
      desc: '有新消息时会在这里通知你',
    },
  };

  const cfg = configs[tab];
  if (!cfg) return null;

  return (
    <div className={`${styles.pagePanel} ${styles.pagePanelMessage} ${active ? styles.pagePanelActive : styles.pagePanelHidden}`}>
      <div className={styles.tabContent}>
        <div className={styles.emptyIcon}>{cfg.icon}</div>
        <p className={styles.emptyTitle}>{cfg.title}</p>
        <p className={styles.emptyDesc}>{cfg.desc}</p>
      </div>
    </div>
  );
}

function MinePage({ onLogout, onEditProfile, onMyPosts, onMyFollowing, onMyFans, onMyDrafts, onMyLikes, onMyBookmarks, onAbout, onGuide, refreshKey, active, cachedStatsRef }) {
  const { profile } = useAuth();
  const displayName = profile.nickname || '校园用户';
  const initial = displayName.charAt(0).toUpperCase();
  const [stats, setStats] = useState(() => cachedStatsRef.current || { posts: 0, following: 0, fans: 0 });
  const requestedRef = useRef(false);

  const fetchStats = useCallback(async (force = false) => {
    if (!force && cachedStatsRef.current) {
      setStats(cachedStatsRef.current);
      return;
    }
    try {
      const [postRes, followRes] = await Promise.all([
        apiClient.get('/posts/count'),
        apiClient.get('/follow/count'),
      ]);
      const nextStats = {
        posts: postRes.data.count || 0,
        following: followRes.data.followingCount || 0,
        fans: followRes.data.fansCount || 0,
      };
      cachedStatsRef.current = nextStats;
      setStats(nextStats);
    } catch {
      setStats(prev => prev);
    }
  }, [cachedStatsRef]);

  useEffect(() => {
    if (!active) {
      return;
    }
    if (!requestedRef.current) {
      requestedRef.current = true;
      fetchStats();
    }
  }, [active, fetchStats]);

  useEffect(() => {
    if (active && refreshKey > 0) {
      fetchStats(true);
    }
  }, [active, refreshKey, fetchStats]);

  return (
    <div className={`${styles.pagePanel} ${styles.pagePanelMine} ${active ? styles.pagePanelActive : styles.pagePanelHidden}`}>
      <div className={styles.mineContent}>
        <div className={styles.profileBanner}>
          <div className={styles.avatarRow}>
            <div className={styles.avatar}>{initial}</div>
            <div className={styles.userInfo}>
              <div className={styles.nickname}>{displayName}</div>
              <span className={styles.identityTag}>{profile.identity}</span>
            </div>
          </div>
          <p className={styles.bio}>{profile.bio}</p>
        </div>

        <button className={styles.editBtn} onClick={onEditProfile}>编辑资料</button>

        <div className={styles.statsRow}>
          <button className={styles.statItem} onClick={onMyPosts}>
            <div className={styles.statNum}>{stats.posts}</div>
            <div className={styles.statLabel}>动态</div>
          </button>
          <button className={styles.statItem} onClick={onMyFollowing}>
            <div className={styles.statNum}>{stats.following}</div>
            <div className={styles.statLabel}>关注</div>
          </button>
          <button className={styles.statItem} onClick={onMyFans}>
            <div className={styles.statNum}>{stats.fans}</div>
            <div className={styles.statLabel}>粉丝</div>
          </button>
        </div>

        <div className={styles.cardFlow}>
          <button className={styles.flowCard} onClick={onMyLikes}>
            <div className={styles.flowCardIcon} style={{ background: '#FF6B6B' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </div>
            <span className={styles.flowCardLabel}>我的点赞</span>
          </button>
          <button className={styles.flowCard} onClick={onMyBookmarks}>
            <div className={styles.flowCardIcon} style={{ background: '#4ECDC4' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            </div>
            <span className={styles.flowCardLabel}>我的收藏</span>
          </button>
          <button className={styles.flowCard} onClick={onMyDrafts}>
            <div className={styles.flowCardIcon} style={{ background: '#45B7D1' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16v16H4z" />
                <path d="M8 4v6h8V4" />
              </svg>
            </div>
            <span className={styles.flowCardLabel}>我的草稿</span>
          </button>
        </div>

        <div className={styles.menuList}>
          <button className={styles.menuItem} onClick={onAbout}>
            <div className={styles.menuIcon} style={{ background: '#8B5CF6' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <span className={styles.menuLabel}>关于我们</span>
            <span className={styles.menuArrow}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </button>
          <button className={styles.menuItem} onClick={onGuide}>
            <div className={styles.menuIcon} style={{ background: '#36CFC9' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
              </svg>
            </div>
            <span className={styles.menuLabel}>使用说明</span>
            <span className={styles.menuArrow}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </button>
        </div>

        <button className={styles.logoutBtn} onClick={onLogout}>退出登录</button>
      </div>
    </div>
  );
}

function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab');
    return tabs.some(t => t.key === tab && t.key !== 'publish') ? tab : 'home';
  });
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishCount, setPublishCount] = useState(0);
  const [activeDraft, setActiveDraft] = useState(null);
  const cachedFeedRef = useRef(feedCacheStore);
  const cachedFeedScrollRef = useRef(feedScrollStore);
  const cachedMineStatsRef = useRef(null);
  const [unreadCounts, setUnreadCounts] = useState({ dm: 0, interaction: 0 });

  useEffect(() => {
    const tab = searchParams.get('tab');
    const next = tabs.some(t => t.key === tab && t.key !== 'publish') ? tab : 'home';
    if (next !== activeTab) {
      setActiveTab(next);
    }
  }, [activeTab, searchParams]);

  useEffect(() => {
    if (location.state?.openPublish) {
      setActiveDraft(location.state?.draft || null);
      setPublishOpen(true);
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    }
  }, [location, navigate]);

  const fetchUnreadCounts = useCallback(async () => {
    try {
      const res = await apiClient.get('/messages/summary');
      setUnreadCounts({
        dm: res.data.dmUnreadCount || 0,
        interaction: res.data.interactionUnreadCount || 0,
      });
    } catch {
      setUnreadCounts({ dm: 0, interaction: 0 });
    }
  }, []);

  useEffect(() => {
    fetchUnreadCounts();
    const interval = setInterval(fetchUnreadCounts, 10000);
    return () => clearInterval(interval);
  }, [fetchUnreadCounts]);

  useEffect(() => {
    if (activeTab === 'message') {
      fetchUnreadCounts();
    }
  }, [activeTab, fetchUnreadCounts]);

  useEffect(() => {
    fetchUnreadCounts();
  }, [location.key, fetchUnreadCounts]);

  const setTabWithUrl = useCallback((tab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  }, [setSearchParams]);

  const handleClick = (key) => {
    if (key === 'publish') {
      setActiveDraft(null);
      setPublishOpen(true);
      return;
    }
    setTabWithUrl(key);
  };

  return (
    <div className={styles.page}>
      <div className={styles.phoneFrame}>
        <div className={styles.content}>
          <HomeFeed refreshKey={publishCount} active={activeTab === 'home'} cachedDataRef={cachedFeedRef} cachedScrollRef={cachedFeedScrollRef} />
          <FriendsFeed refreshKey={publishCount} active={activeTab === 'friends'} cachedDataRef={cachedFeedRef} cachedScrollRef={cachedFeedScrollRef} />
          <MinePage
            onLogout={logout}
            onEditProfile={() => navigate('/edit-profile')}
            onMyPosts={() => navigate('/my-posts')}
            onMyFollowing={() => navigate('/my-following')}
            onMyFans={() => navigate('/my-fans')}
            onMyDrafts={() => navigate('/my-drafts')}
            onMyLikes={() => navigate('/my-likes')}
            onMyBookmarks={() => navigate('/my-bookmarks')}
            onAbout={() => navigate('/about')}
            onGuide={() => navigate('/guide')}
            refreshKey={publishCount}
            active={activeTab === 'mine'}
            cachedStatsRef={cachedMineStatsRef}
          />
          <div className={`${styles.pagePanel} ${styles.pagePanelMessage} ${activeTab === 'message' ? styles.pagePanelActive : styles.pagePanelHidden}`}>
            <MessagesPage />
          </div>
          <PageContent tab={activeTab} active={activeTab !== 'home' && activeTab !== 'friends' && activeTab !== 'mine' && activeTab !== 'message'} />
        </div>

        <nav className={styles.nav}>
          {tabs.map((t) => {
            if (t.key === 'publish') {
              return (
                <button key={t.key} className={styles.publishTab} onClick={() => handleClick(t.key)}>
                  <div className={styles.publishBtn}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                </button>
              );
            }
            const active = activeTab === t.key;
            return (
              <button key={t.key} className={`${styles.tab} ${active ? styles.active : ''}`} onClick={() => handleClick(t.key)}>
                {t.key === 'home' && <HomeIcon />}
                {t.key === 'friends' && <FriendsIcon />}
                {t.key === 'message' && <MessageIcon hasUnread={unreadCounts.dm > 0 || unreadCounts.interaction > 0} />}
                {t.key === 'mine' && <MineIcon />}
                <span className={styles.tabLabel}>{t.label}</span>
              </button>
            );
          })}
        </nav>

        <PublishModal
          open={publishOpen}
          initialDraft={activeDraft}
          onClose={() => {
            setPublishOpen(false);
            setActiveDraft(null);
          }}
          onDraftSaved={() => {
            setPublishOpen(false);
            setActiveDraft(null);
          }}
          onSuccess={() => {
            setPublishOpen(false);
            setActiveDraft(null);
            setPublishCount(c => c + 1);
            if (activeTab !== 'home') {
              setTabWithUrl('home');
            }
          }}
        />
      </div>
    </div>
  );
}

export default DashboardPage;
