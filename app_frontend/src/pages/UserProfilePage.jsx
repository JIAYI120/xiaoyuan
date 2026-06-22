import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';
import CommentModal from '../components/CommentModal';
import styles from './UserProfile.module.css';

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
  const content = typeof text === 'string' ? text : '';

  return (
    <div className={styles.postContent}>
      <span style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {content}
      </span>
      <button className={styles.viewDetailBtn} onClick={() => navigate(`/post/${postId}`)}>
        查看详细
      </button>
    </div>
  );
}

function UserProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const isOwnProfile = currentUser && currentUser._id === id;
  const [userInfo, setUserInfo] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [mutual, setMutual] = useState(false);
  const [followedByTarget, setFollowedByTarget] = useState(false);
  const [fansCount, setFansCount] = useState(0);
  const [commentPostId, setCommentPostId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, postsRes, fansRes] = await Promise.all([
        apiClient.get(`/users/${id}/profile`),
        apiClient.get(`/posts/user/${id}`),
        apiClient.get('/follow/fans').catch(() => ({ data: [] })),
      ]);
      const profileData = profileRes.data || {};
      const fansList = Array.isArray(fansRes.data) ? fansRes.data : [];
      const isFollowing = Boolean(profileData.isFollowing);
      const isMutual = Boolean(profileData.isMutual);
      const isFollowedByTarget = Boolean(
        profileData.isFollowedBy ??
        profileData.followsMe ??
        profileData.followedMe ??
        profileData.isFan ??
        profileData.isFollower ??
        profileData.followsCurrentUser ??
        fansList.some(user => user._id === id)
      );
      setUserInfo(profileData);
      setFollowing(isFollowing);
      setMutual(isMutual);
      setFollowedByTarget(isMutual || isFollowedByTarget);
      setFansCount(profileData.fansCount || 0);
      const list = Array.isArray(postsRes.data) ? postsRes.data : [];
      if (list.length > 0) {
        const ids = list.map(p => p._id).join(',');
        try {
          const [likeRes, bookmarkRes] = await Promise.all([
            apiClient.get(`/likes/status?posts=${ids}`),
            apiClient.get(`/bookmarks/status?posts=${ids}`),
          ]);
          setPosts(list.map(post => ({
            ...post,
            liked: !!likeRes.data?.[post._id],
            bookmarked: !!bookmarkRes.data?.[post._id],
          })));
        } catch {
          setPosts(list.map(post => ({ ...post, liked: false, bookmarked: false })));
        }
      } else {
        setPosts([]);
      }
    } catch {
      setUserInfo(null);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFollow = useCallback(async () => {
    try {
      if (following) {
        await apiClient.delete(`/follow/${id}`);
        setFollowing(false);
        setMutual(false);
        setFansCount(c => Math.max(0, c - 1));
      } else {
        const res = await apiClient.post(`/follow/${id}`);
        const isMutual = Boolean(res.data?.isMutual ?? followedByTarget);
        setFollowing(true);
        setMutual(isMutual);
        setFansCount(c => c + 1);
      }
    } catch {
      setFollowing(prev => prev);
    }
  }, [following, id, followedByTarget]);

  const handleLike = useCallback((postId) => {
    setPosts(prev => {
      const target = prev.find(p => p._id === postId);
      if (!target) return prev;
      const liked = !target.liked;
      const currentLikeCount = target.likeCount ?? target.likes ?? 0;
      if (liked) {
        apiClient.post(`/likes/${postId}`).catch(() => null);
      } else {
        apiClient.delete(`/likes/${postId}`).catch(() => null);
      }
      return prev.map(p => p._id === postId ? {
        ...p,
        liked,
        likeCount: liked ? currentLikeCount + 1 : Math.max(0, currentLikeCount - 1),
        likes: liked ? currentLikeCount + 1 : Math.max(0, currentLikeCount - 1),
      } : p);
    });
  }, []);

  const handleBookmark = useCallback((postId) => {
    setPosts(prev => {
      const target = prev.find(p => p._id === postId);
      if (!target) return prev;
      const bookmarked = !target.bookmarked;
      const currentBookmarkCount = target.bookmarkCount ?? 0;
      if (bookmarked) {
        apiClient.post(`/bookmarks/${postId}`).catch(() => null);
      } else {
        apiClient.delete(`/bookmarks/${postId}`).catch(() => null);
      }
      return prev.map(p => p._id === postId ? {
        ...p,
        bookmarked,
        bookmarkCount: bookmarked ? currentBookmarkCount + 1 : Math.max(0, currentBookmarkCount - 1),
      } : p);
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

  const handleCommentCountChange = useCallback((delta) => {
    if (commentPostId) {
      setPosts(prev => prev.map(p => p._id === commentPostId ? { ...p, commentCount: (p.commentCount || 0) + delta } : p));
    }
  }, [commentPostId]);

  const BackBtn = () => (
    <button className={styles.backBtn} onClick={() => navigate(-1)}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  );

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.phoneFrame}>
          <div className={styles.navBar}>
            <div className={styles.navLeft}><BackBtn /></div>
            <span className={styles.navTitle}>用户主页</span>
            <div className={styles.navRight} />
          </div>
          <div className={styles.loading}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" />
            </svg>
            加载中...
          </div>
        </div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className={styles.page}>
        <div className={styles.phoneFrame}>
          <div className={styles.navBar}>
            <div className={styles.navLeft}><BackBtn /></div>
            <span className={styles.navTitle}>用户主页</span>
            <div className={styles.navRight} />
          </div>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <span className={styles.emptyText}>用户不存在</span>
          </div>
        </div>
      </div>
    );
  }

  const displayName = userInfo.nickname || '校园用户';
  const initial = displayName.charAt(0).toUpperCase();
  const messageTargetId = userInfo._id || id;
  const profileBio = userInfo.bio || userInfo.signature || userInfo.introduction || '这个人很低调，暂时没有填写简介';
  const followButtonText = mutual ? '互相关注' : following ? '已关注' : followedByTarget ? '回关' : '关注';

  return (
    <div className={styles.page}>
      <div className={styles.phoneFrame}>
        <div className={styles.navBar}>
          <div className={styles.navLeft}><BackBtn /></div>
          <span className={styles.navTitle}>用户主页</span>
          <div className={styles.navRight} />
        </div>

        <div className={styles.body}>
          <div className={styles.profileBanner}>
            <div className={styles.avatarRow}>
              <div className={styles.avatar}>{initial}</div>
              <div className={styles.userInfo}>
                <div className={styles.nickname}>{displayName}</div>
                <span className={styles.identityTag}>{userInfo.identity || '学生'}</span>
              </div>
            </div>
            <p className={styles.bio}>{profileBio}</p>
          </div>

          <div className={styles.statsRow}>
            <button className={styles.statItem}>
              <div className={styles.statNum}>{posts.length}</div>
              <div className={styles.statLabel}>动态</div>
            </button>
            <button className={styles.statItem}>
              <div className={styles.statNum}>{fansCount}</div>
              <div className={styles.statLabel}>粉丝</div>
            </button>
          </div>

          {!isOwnProfile && (
            <div className={styles.followBtnWrapper}>
              <div className={styles.actionRow}>
                <button className={`${styles.followBtn} ${styles.halfBtn} ${following ? styles.secondary : styles.primary}`} onClick={handleFollow}>
                  {followButtonText}
                </button>
                <button
                  className={`${styles.messageBtn} ${styles.halfBtn}`}
                  onClick={() => navigate(`/messages/${messageTargetId}`, {
                    state: {
                      conversation: {
                        userId: messageTargetId,
                        nickname: displayName,
                        avatarText: initial,
                      },
                    },
                  })}
                >
                  私信
                </button>
              </div>
            </div>
          )}

          <div className={styles.sectionTitle}>TA的动态</div>
          {posts.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <span className={styles.emptyText}>暂未发布动态</span>
            </div>
          ) : (
            <div className={styles.postList}>
              {posts.map(post => {
                const likeCount = post.likeCount ?? post.likes ?? 0;
                const bookmarkCount = post.bookmarkCount ?? 0;

                return (
                  <div key={post._id} className={styles.postCard}>
                    <div className={styles.postHeader}>
                      <div className={styles.postAvatar}>{initial}</div>
                      <div className={styles.postUser}>
                        <div className={styles.postName}>{displayName}</div>
                        <div className={styles.postTime}>{renderPostMeta(post)}</div>
                      </div>
                      {isOwnProfile && (
                        <button className={styles.deleteBtn} onClick={() => handleDelete(post._id)}>
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
                      <button className={styles.actionBtn} onClick={() => setCommentPostId(post._id)}>
                        <span className={styles.actionIcon}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                          </svg>
                        </span>
                        <span>{post.commentCount || 0}</span>
                      </button>

                      <button className={`${styles.actionBtn} ${post.liked ? styles.liked : ''}`} onClick={() => handleLike(post._id)}>
                        <span className={styles.actionIcon}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill={post.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                          </svg>
                        </span>
                        <span>{likeCount}</span>
                      </button>

                      <button className={`${styles.actionBtn} ${post.bookmarked ? styles.bookmarked : ''}`} onClick={() => handleBookmark(post._id)}>
                        <span className={styles.actionIcon}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill={post.bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                          </svg>
                        </span>
                        <span>{bookmarkCount}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {commentPostId && (
          <CommentModal
            open={!!commentPostId}
            postId={commentPostId}
            onClose={() => setCommentPostId(null)}
            onCountChange={handleCommentCountChange}
          />
        )}
      </div>
    </div>
  );
}

export default UserProfilePage;
