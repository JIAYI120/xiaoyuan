import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import InputField from '../components/InputField';
import Illustration from '../components/Illustration';
import Modal from '../components/Modal';
import UserAgreement from '../content/UserAgreement';
import PrivacyPolicy from '../content/PrivacyPolicy';
import styles from './Login.module.css';

function LoginPage() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) {
      setError('请先同意用户协议和隐私政策');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = await apiClient.post('/users/login', { name, password });
      login(response.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.msg || '登录失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const EyeOpen = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const EyeClosed = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

  return (
    <div className={styles.page}>
      <div className={styles.phoneFrame}>
        <div className={styles.illustrationBg}>
          <Illustration full />
        </div>
        <div className={styles.gridOverlay} />

        <div className={styles.content}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.logo}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
                </svg>
              </div>
              <h1 className={styles.title}>欢迎回来</h1>
              <p className={styles.subtitle}>请登录您的校园微博账号</p>
            </div>

            {error && (
              <div className={styles.errorBox}>{error}</div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.fieldGroup}>
                <label>用户名</label>
                <InputField
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入用户名"
                  required
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M20 21a8 8 0 10-16 0" />
                    </svg>
                  }
                />
              </div>

              <div className={styles.fieldGroup}>
                <label>密码</label>
                <InputField
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  required
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                      <circle cx="12" cy="16.5" r="1.5" />
                    </svg>
                  }
                  suffix={
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowPwd(!showPwd); }}
                      className={styles.eyeBtn}
                    >
                      {showPwd ? EyeOpen : EyeClosed}
                    </button>
                  }
                />
              </div>

              <div className={styles.buttonGroup}>
                <button type="submit" disabled={loading} className={styles.submitBtn}>
                  {loading ? '登录中...' : '登 录'}
                </button>
              </div>
            </form>

            <div className={styles.switchLink}>
              没有账号？
              <Link to="/register">去注册</Link>
            </div>

            <div className={styles.agreement}>
              <label className={styles.agreementLabel}>
                <div className={styles.checkboxWrapper}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className={styles.checkboxInput}
                  />
                  <div className={styles.checkboxBox}>
                    {agreed && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className={styles.agreementText}>
                  同意
                  <span onClick={(e) => { e.preventDefault(); setModal('agreement'); }} className={styles.link}>
                    《用户协议》
                  </span>
                  和
                  <span onClick={(e) => { e.preventDefault(); setModal('privacy'); }} className={styles.link}>
                    《隐私政策》
                  </span>
                </span>
              </label>
            </div>
          </div>
        </div>

        <Modal open={modal === 'agreement'} onClose={() => setModal(null)} title="用户协议">
          <UserAgreement />
        </Modal>
        <Modal open={modal === 'privacy'} onClose={() => setModal(null)} title="隐私政策">
          <PrivacyPolicy />
        </Modal>
      </div>
    </div>
  );
}

export default LoginPage;
