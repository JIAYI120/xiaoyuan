import { useNavigate } from 'react-router-dom';
import PostList from '../components/PostList';
import styles from './MyPosts.module.css';

function MyBookmarksPage() {
  const navigate = useNavigate();

  const emptyIcon = (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </svg>
  );

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
          <span className={styles.navTitle}>我的收藏</span>
          <div className={styles.navRight} />
        </div>

        <PostList apiEndpoint="/bookmarks/mine" emptyText="暂无收藏动态" emptyIcon={emptyIcon} />
      </div>
    </div>
  );
}

export default MyBookmarksPage;