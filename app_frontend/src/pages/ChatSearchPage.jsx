import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import apiClient from '../api/axios';
import styles from './ChatSearch.module.css';

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}`;
}

function ChatSearchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const conversation = location.state?.conversation;
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [errorText, setErrorText] = useState('');

  const partnerName = useMemo(() => conversation?.nickname || '聊天记录', [conversation?.nickname]);

  useEffect(() => {
    if (!keyword.trim()) {
      setResults([]);
      setErrorText('');
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/messages/search/${id}`, {
          params: { keyword: keyword.trim() },
        });
        setResults(res.data?.list || []);
        setErrorText('');
      } catch (err) {
        setResults([]);
        setErrorText(err.response?.data?.msg || '查找聊天记录失败');
      } finally {
        setLoading(false);
      }
    }, 260);

    return () => window.clearTimeout(timer);
  }, [id, keyword]);

  return (
    <div className={styles.page}>
      <div className={styles.phoneFrame}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className={styles.headerTitle}>查找聊天记录</div>
          <div className={styles.headerSpacer} />
        </div>

        <div className={styles.searchWrap}>
          <input
            className={styles.searchInput}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={`搜索与${partnerName}的聊天内容`}
            autoFocus
          />
        </div>

        <div className={styles.resultList}>
          {!keyword.trim() ? (
            <div className={styles.emptyState}>输入关键词查找当前会话的历史消息</div>
          ) : loading ? (
            <div className={styles.emptyState}>搜索中...</div>
          ) : errorText ? (
            <div className={styles.emptyState}>{errorText}</div>
          ) : results.length === 0 ? (
            <div className={styles.emptyState}>未找到相关聊天记录</div>
          ) : (
            results.map(item => (
              <div key={item._id} className={styles.resultItem}>
                <div className={styles.resultTop}>
                  <span className={styles.resultSender}>{item.isSelf ? '我' : partnerName}</span>
                  <span className={styles.resultTime}>{formatTime(item.createdAt)}</span>
                </div>
                <p className={styles.resultContent}>{item.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatSearchPage;
