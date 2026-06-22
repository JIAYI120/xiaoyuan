import { useNavigate } from 'react-router-dom';
import s from './AboutPage.module.css';

function AboutPage() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className={s.container}>
      <div className={s.header}>
        <button className={s.backBtn} onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className={s.title}>关于我们</h1>
        <div className={s.placeholder}></div>
      </div>

      <div className={s.content}>
        <div className={s.logoSection}>
          <div className={s.logo}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h2 className={s.appName}>校园微博</h2>
          <p className={s.appSubtitle}>连接校园，分享生活</p>
        </div>

        <section className={s.section}>
          <h3 className={s.heading3}>关于我们</h3>
          <p className={s.p}>校园平台是一个专为学生打造的社交网络应用，致力于为校园生活增添色彩，让同学们能够更好地交流、分享和互动。</p>
        </section>

        <section className={s.section}>
          <h3 className={s.heading3}>我们的使命</h3>
          <p className={s.p}>打造一个安全、友好、充满活力的校园社交环境，帮助大家发现更多精彩，建立有意义的连接。</p>
        </section>

        <section className={s.section}>
          <h3 className={s.heading3}>联系我们</h3>
          <div className={s.contactItem}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <span>2377200640@qq.com</span>
          </div>
        </section>

        <section className={s.section}>
          <h3 className={s.heading3}>版本信息</h3>
          <p className={s.p}>当前版本：v1.0.0</p>
          <p className={s.p}>更新日期：2026年6月</p>
        </section>

        <div className={s.copyright}>
          <p>&copy; 2026 校园平台. 保留所有权利.</p>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;