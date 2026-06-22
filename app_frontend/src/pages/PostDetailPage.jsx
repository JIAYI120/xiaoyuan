import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePostState } from '../context/PostStateContext';
import apiClient from '../api/axios';
import CommentModal from '../components/CommentModal';
import styles from './PostDetail.module.css';

function formatPostTime(dateStr) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${month}-${day}`;
}

function FullContent({ text }) {
  return (
    <div className={styles.postContent}>
      <p>{text}</p>
    </div>
  );
}

function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { updatePostState, triggerFeedRefresh } = usePostState();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentPostId, setCommentPostId] = useState(null);
  const [showImageModal, setShowImageModal] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  
  const feedEndpoint = location.state?.feedEndpoint || '/posts/feed';

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/posts/${id}`);
        const postData = res.data;
        setPost(postData);
        setError('');
      } catch (err) {
        setError('帖子不存在或已删除');
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    const fetchComments = async () => {
      if (!id) return;
      try {
        const res = await apiClient.get(`/comments/${id}`);
        setComments(Array.isArray(res.data) ? res.data : []);
      } catch {
        setComments([]);
      }
    };

    if (id) {
      fetchPost();
      fetchComments();
    }

    // 设置定时刷新，每15秒刷新一次评论
    const interval = setInterval(() => {
      if (id && !sendingComment) {
        fetchComments();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [id]);

  const handleDeleteComment = async (commentId) => {
    try {
      await apiClient.delete(`/comments/${commentId}`);
      setComments(prev => prev.filter(c => c._id !== commentId));
      setPost(prev => ({
        ...prev,
        commentCount: Math.max(0, (prev.commentCount || 0) - 1),
      }));
    } catch {
      // ignore error
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || sendingComment || !id) return;
    setSendingComment(true);
    try {
      const res = await apiClient.post(`/comments/${id}`, { content: commentText.trim() });
      setComments(prev => [res.data, ...prev]);
      setCommentText('');
      const newCount = (post?.commentCount || 0) + 1;
      setPost(prev => ({
        ...prev,
        commentCount: newCount,
      }));
      updatePostState(id, { commentCount: newCount });
    } catch {
      // ignore error
    }
    setSendingComment(false);
  };

  const handleCommentKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  };

  const handleBack = useCallback(() => {
    triggerFeedRefresh(feedEndpoint);
    navigate(-1);
  }, [feedEndpoint, triggerFeedRefresh, navigate]);

  const handleLike = async (postId) => {
    try {
      const currentLiked = post?.liked || false;
      if (currentLiked) {
        await apiClient.delete(`/likes/${postId}`);
      } else {
        await apiClient.post(`/likes/${postId}`);
      }
      const newLiked = !currentLiked;
      setPost(prev => ({
        ...prev,
        liked: newLiked,
        likeCount: newLiked ? (prev.likeCount || 0) + 1 : Math.max(0, (prev.likeCount || 0) - 1),
      }));
      updatePostState(postId, {
        liked: newLiked,
        likeCount: newLiked ? ((post?.likeCount || 0) + 1) : Math.max(0, (post?.likeCount || 0) - 1),
      });
    } catch {
      // ignore error
    }
  };

  const handleBookmark = async (postId) => {
    try {
      const currentBookmarked = post?.bookmarked || false;
      if (currentBookmarked) {
        await apiClient.delete(`/bookmarks/${postId}`);
      } else {
        await apiClient.post(`/bookmarks/${postId}`);
      }
      const newBookmarked = !currentBookmarked;
      setPost(prev => ({
        ...prev,
        bookmarked: newBookmarked,
        bookmarkCount: newBookmarked ? (prev.bookmarkCount || 0) + 1 : Math.max(0, (prev.bookmarkCount || 0) - 1),
      }));
      updatePostState(postId, {
        bookmarked: newBookmarked,
        bookmarkCount: newBookmarked ? ((post?.bookmarkCount || 0) + 1) : Math.max(0, (post?.bookmarkCount || 0) - 1),
      });
    } catch {
      // ignore error
    }
  };

  const handleUserClick = () => {
    if (post) {
      navigate(`/user/${post.user}`);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.phoneFrame}>
          <div className={styles.header}>
            <button className={styles.backBtn} onClick={handleBack}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className={styles.headerTitle}>帖子详情</div>
            <div className={styles.headerSpacer} />
          </div>
          <div className={styles.content}>
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <span className={styles.loadingText}>加载中...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.phoneFrame}>
          <div className={styles.header}>
            <button className={styles.backBtn} onClick={handleBack}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className={styles.headerTitle}>帖子详情</div>
            <div className={styles.headerSpacer} />
          </div>
          <div className={styles.content}>
            <div className={styles.errorState}>
              <div className={styles.errorIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <span className={styles.errorText}>{error}</span>
              <button className={styles.backBtnOutline} onClick={handleBack}>
                返回
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const initial = post.nickname ? post.nickname.charAt(0).toUpperCase() : 'U';
  const imageCount = post.images?.length || 0;

  return (
    <div className={styles.page}>
      <div className={styles.phoneFrame}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={handleBack}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className={styles.headerTitle}>帖子详情</div>
          <div className={styles.headerSpacer} />
        </div>

        <div className={styles.content}>
          <div className={styles.postCard}>
            <div className={styles.postHeader}>
              <div className={styles.avatarWrap}>
                <div className={styles.avatar}>{initial}</div>
              </div>
              <div className={styles.userInfo}>
                <div className={styles.userName}>{post.nickname || '校园用户'}</div>
                <div className={styles.userMeta}>
                  <span className={styles.identity}>{post.identity || '学生'}</span>
                  <span className={styles.dot}>·</span>
                  <span className={styles.time}>{formatPostTime(post.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className={styles.postBody}>
              <FullContent text={post.content} />
              
              {post.topic && (
                <div className={styles.topicTag}>
                  <span className={styles.tagIcon}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                  </span>
                  <span className={styles.tagText}>#{post.topic}</span>
                </div>
              )}

              {imageCount > 0 && (
                <div className={`${styles.imageGrid} ${imageCount === 1 ? styles.singleImage : ''} ${imageCount === 2 ? styles.doubleImage : ''}`}>
                  {post.images.map((img, idx) => (
                    <div 
                      key={idx} 
                      className={styles.imageItem}
                      onClick={() => setShowImageModal(img)}
                    >
                      <img src={img} alt="" className={styles.postImage} />
                      {imageCount > 1 && idx === 0 && imageCount > 3 && (
                        <div className={styles.moreCount}>+{imageCount - 3}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.actionsBar}>
              <button className={styles.actionItem} onClick={() => setCommentPostId(post._id)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                <span>{post.commentCount || 0}</span>
              </button>
              <button 
                className={`${styles.actionItem} ${post.liked ? styles.liked : ''}`}
                onClick={() => handleLike(post._id)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={post.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
                <span>{post.likeCount || 0}</span>
              </button>
              <button 
                className={`${styles.actionItem} ${post.bookmarked ? styles.bookmarked : ''}`}
                onClick={() => handleBookmark(post._id)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={post.bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                </svg>
                <span>{post.bookmarkCount || 0}</span>
              </button>
            </div>

            <div className={styles.commentsSection}>
              <div className={styles.commentsHeader}>
                <span className={styles.commentsTitle}>评论</span>
                <span className={styles.commentsCount}>{post.commentCount || 0}</span>
              </div>
              <div className={styles.commentsList}>
                {commentsLoading ? (
                  <div className={styles.loadingComments}>
                    <div className={styles.spinner} />
                    <span>加载评论中...</span>
                  </div>
                ) : comments.length === 0 ? (
                  <div className={styles.noComments}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    <span>暂无评论</span>
                  </div>
                ) : (
                  comments.map(comment => {
                    const commentInitial = comment.nickname ? comment.nickname.charAt(0).toUpperCase() : 'U';
                    const canDelete = !!comment.canDelete || (user && comment.user?.toString() === user._id);
                    return (
                      <div key={comment._id} className={styles.commentItem}>
                        <div 
                            className={styles.commentAvatar}
                            onClick={() => comment.user && navigate(`/user/${comment.user}`)}
                            style={{ cursor: comment.user ? 'pointer' : 'default' }}
                          >{commentInitial}</div>
                        <div className={styles.commentContent}>
                          <div className={styles.commentHeader}>
                            <span className={styles.commentNickname}>{comment.nickname || '校园用户'}</span>
                            <span className={styles.commentTime}>{formatPostTime(comment.createdAt)}</span>
                          </div>
                          <p className={styles.commentText}>{comment.content}</p>
                        </div>
                        {canDelete && (
                          <button 
                            className={styles.deleteCommentBtn}
                            onClick={() => handleDeleteComment(comment._id)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.commentInputBar}>
          <input
            className={styles.commentInput}
            placeholder="写评论..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleCommentKeyDown}
            maxLength={200}
          />
          <button
            className={styles.commentSendBtn}
            disabled={!commentText.trim() || sendingComment}
            onClick={handleSendComment}
          >
            {sendingComment ? '...' : '发送'}
          </button>
        </div>
      </div>

      {commentPostId && (
        <CommentModal
          open={!!commentPostId}
          postId={commentPostId}
          onClose={() => setCommentPostId(null)}
          onCountChange={(change) => {
            setPost(prev => ({
              ...prev,
              commentCount: Math.max(0, (prev.commentCount || 0) + change),
            }));
            // 刷新评论列表
            const fetchComments = async () => {
              try {
                const res = await apiClient.get(`/comments/${id}`);
                setComments(Array.isArray(res.data) ? res.data : []);
              } catch {
                setComments([]);
              }
            };
            fetchComments();
          }}
        />
      )}

      {showImageModal && (
        <div className={styles.imageModal} onClick={() => setShowImageModal(null)}>
          <img src={showImageModal} alt="" className={styles.modalImage} />
        </div>
      )}
    </div>
  );
}

export default PostDetailPage;
