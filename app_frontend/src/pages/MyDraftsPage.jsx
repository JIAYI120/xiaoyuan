import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import styles from './MyPosts.module.css';

function formatDraftTime(dateStr) {
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

function DraftBadgeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h9l5 5v13H6z" />
      <path d="M15 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </svg>
  );
}

function DraftCard({ draft, onDelete, onEdit }) {
  return (
    <div className={styles.postCard}>
      <button className={styles.postHeader} onClick={() => onEdit(draft)}>
        <div className={styles.draftAvatar}>
          <span className={styles.draftAvatarInner}><DraftBadgeIcon /></span>
        </div>
        <div className={styles.postUser}>
          <div className={styles.postName}>未发布草稿</div>
          <div className={styles.postTime}>{formatDraftTime(draft.updatedAt)}{draft.topic ? ` · #${draft.topic}` : ''}</div>
        </div>
      </button>
      <div className={styles.postContent}>{draft.content || '暂无文字内容'}</div>
      {draft.images?.length > 0 && (
        <div className={styles.postImages}>
          {draft.images.map((img, idx) => (
            <div key={`${draft._id}_${idx}`} className={styles.postImage}>
              <img src={img} alt="" />
            </div>
          ))}
        </div>
      )}
      <div className={styles.postActions}>
        <button className={styles.actionBtn} onClick={() => onEdit(draft)}>
          继续编辑
        </button>
        <button className={styles.actionBtn} onClick={() => onDelete(draft._id)}>
          删除草稿
        </button>
      </div>
    </div>
  );
}

function MyDraftsPage() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);

  const fetchDrafts = useCallback(async () => {
    try {
      const res = await apiClient.get('/posts/drafts');
      setDrafts(Array.isArray(res.data) ? res.data : []);
    } catch {
      setDrafts([]);
    }
  }, []);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const handleDelete = async (draftId) => {
    try {
      await apiClient.delete(`/posts/drafts/${draftId}`);
      setDrafts(prev => prev.filter(item => item._id !== draftId));
    } catch {
      setDrafts(prev => prev);
    }
  };

  const handleEdit = (draft) => {
    navigate('/?tab=home', {
      replace: true,
      state: {
        openPublish: true,
        draft,
      },
    });
  };

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
          <span className={styles.navTitle}>我的草稿</span>
          <div className={styles.navRight} />
        </div>

        <div className={styles.body}>
          {drafts.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16v16H4z" />
                  <path d="M8 4v6h8V4" />
                </svg>
              </div>
              <span className={styles.emptyText}>暂无草稿内容</span>
            </div>
          ) : (
            <div className={styles.postList}>
              {drafts.map(draft => (
                <DraftCard key={draft._id} draft={draft} onDelete={handleDelete} onEdit={handleEdit} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyDraftsPage;
