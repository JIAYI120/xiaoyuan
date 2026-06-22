import { useNavigate } from 'react-router-dom';
import s from './GuidePage.module.css';

function GuidePage() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const features = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 15s1.5-2 4-2 4 2 4 2" />
          <circle cx="9" cy="9" r="1" fill="currentColor" />
          <circle cx="15" cy="9" r="1" fill="currentColor" />
        </svg>
      ),
      title: '发布动态',
      desc: '分享你的校园生活，上传照片、视频，记录精彩瞬间'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      title: '关注好友',
      desc: '关注同学和朋友，及时获取他们的最新动态'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
      title: '点赞互动',
      desc: '为喜欢的内容点赞，表达你的支持和喜爱'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      title: '评论交流',
      desc: '在动态下方发表评论，与好友互动交流'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      ),
      title: '私信聊天',
      desc: '与好友一对一私信聊天，分享悄悄话'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 11H5" />
          <path d="M13 17H5" />
          <path d="M19 5H5" />
        </svg>
      ),
      title: '查看动态',
      desc: '浏览首页推荐动态，发现新鲜事'
    }
  ];

  return (
    <div className={s.container}>
      <div className={s.header}>
        <button className={s.backBtn} onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className={s.title}>使用说明</h1>
        <div className={s.placeholder}></div>
      </div>

      <div className={s.content}>
        <div className={s.welcomeSection}>
          <div className={s.welcomeIcon}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#07C160" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h2 className={s.welcomeTitle}>欢迎使用校园平台</h2>
          <p className={s.welcomeDesc}>以下是使用指南，帮助你快速上手</p>
        </div>

        <section className={s.section}>
          <h3 className={s.heading3}>功能介绍</h3>
          <div className={s.featureGrid}>
            {features.map((feature, index) => (
              <div key={index} className={s.featureCard}>
                <div className={s.featureIcon}>{feature.icon}</div>
                <h4 className={s.featureTitle}>{feature.title}</h4>
                <p className={s.featureDesc}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={s.section}>
          <h3 className={s.heading3}>使用小贴士</h3>
          <ul className={s.tipsList}>
            <li className={s.tipItem}>
              <span className={s.tipNum}>1</span>
              <span className={s.tipText}>发布内容时尽量添加相关话题标签</span>
            </li>
            <li className={s.tipItem}>
              <span className={s.tipNum}>2</span>
              <span className={s.tipText}>合理设置隐私权限，保护个人信息安全</span>
            </li>
            <li className={s.tipItem}>
              <span className={s.tipNum}>3</span>
              <span className={s.tipText}>遇到问题可以随时联系我们的客服团队</span>
            </li>
            <li className={s.tipItem}>
              <span className={s.tipNum}>4</span>
              <span className={s.tipText}>遵守社区规范，共同维护良好的交流环境</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default GuidePage;
