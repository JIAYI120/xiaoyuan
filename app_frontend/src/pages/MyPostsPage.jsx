import { useNavigate } from 'react-router-dom';
import PostList from '../components/PostList';
import styles from './MyPosts.module.css';

function MyPostsPage() {
  const navigate = useNavigate();

  const emptyIcon = (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
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
          <span className={styles.navTitle}>我的动态</span>
          <div className={styles.navRight} />
        </div>

        <PostList apiEndpoint="/posts/mine" emptyText="暂无发布动态" emptyIcon={emptyIcon} enableDelete={true} />
      </div>
    </div>
  );
}

export default MyPostsPage;