import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import apiClient from '../api/axios';
import styles from './PublishModal.module.css';

const TOPICS = [
  '校园生活', '学习交流', '社团活动', '美食推荐',
  '二手闲置', '我要表白', '失物招领', '就业实习',
];

function normalizeImages(images = []) {
  return images.map(item => typeof item === 'string' ? { url: item, name: 'image' } : item).filter(item => item?.url);
}

function PublishModal({ open, onClose, onSuccess, initialDraft = null, onDraftSaved }) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [topic, setTopic] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState('');
  const [editingDraftId, setEditingDraftId] = useState('');
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const fileInputRef = useRef(null);
  const hydratedRef = useRef(false);

  const hasDraftContent = useMemo(() => Boolean(content.trim() || images.length > 0 || topic), [content, images.length, topic]);
  const isEditingDraft = Boolean(editingDraftId);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1500);
  }, []);

  const resetEditor = useCallback(() => {
    setContent('');
    setImages([]);
    setTopic('');
    setEditingDraftId('');
    setConfirmDiscardOpen(false);
    hydratedRef.current = false;
  }, []);

  useEffect(() => {
    if (!open) {
      resetEditor();
      return;
    }

    if (hydratedRef.current) {
      return;
    }

    hydratedRef.current = true;

    if (initialDraft) {
      setEditingDraftId(initialDraft._id || '');
      setContent(initialDraft.content || '');
      setImages(normalizeImages(initialDraft.images));
      setTopic(initialDraft.topic || '');
      return;
    }

    resetEditor();
    hydratedRef.current = true;
  }, [open, initialDraft, resetEditor]);

  const closeImmediately = () => {
    resetEditor();
    onClose?.();
  };

  const handlePickImage = () => {
    if (images.length >= 9) {
      showToast('最多上传9张图片');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 9) {
      showToast('最多上传9张图片');
      return;
    }
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages(prev => [...prev, { url: ev.target.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemoveImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleToggleTopic = (t) => {
    setTopic(prev => prev === t ? '' : t);
  };

  const canPublish = content.trim().length > 0 && !publishing;

  const handlePublish = async () => {
    if (!canPublish) return;
    setPublishing(true);
    try {
      const payload = {
        content: content.trim(),
        images: images.map(img => img.url),
        topic: topic || undefined,
        draftId: editingDraftId || undefined,
      };
      await apiClient.post('/posts', payload);
      showToast('发布成功');
      resetEditor();
      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 600);
    } catch {
      showToast('发布失败，请重试');
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!hasDraftContent) {
      showToast('暂无可保存内容');
      return;
    }

    try {
      const payload = {
        content: content.trim(),
        images: images.map(img => img.url),
        topic: topic || '',
      };

      const res = editingDraftId
        ? await apiClient.put(`/posts/drafts/${editingDraftId}`, payload)
        : await apiClient.post('/posts/drafts', payload);

      const savedDraft = res.data;
      setEditingDraftId(savedDraft?._id || '');
      showToast('保存成功');
      setTimeout(() => {
        onDraftSaved?.(savedDraft);
        resetEditor();
        onClose?.();
      }, 500);
    } catch {
      showToast('保存失败，请重试');
    }
  };

  const handleCancel = () => {
    if (hasDraftContent) {
      setConfirmDiscardOpen(true);
      return;
    }
    closeImmediately();
  };

  const handleConfirmDiscard = () => {
    closeImmediately();
  };

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.backdrop} />
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.navBar}>
          <button className={styles.cancelBtn} onClick={handleCancel}>取消</button>
          <div className={styles.titleWrap}>
            <span className={styles.navTitle}>{isEditingDraft ? '编辑草稿' : '发布动态'}</span>
            <span className={styles.navSubtitle}>{isEditingDraft ? '来自我的草稿' : '新建动态'}</span>
          </div>
          <button
            className={styles.publishBtn}
            disabled={!canPublish}
            onClick={handlePublish}
          >
            {publishing ? '发布中...' : '发布'}
          </button>
        </div>

        <div className={styles.body}>
          <textarea
            className={styles.textArea}
            placeholder="分享校园新鲜事..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
          />

          <div className={styles.section}>
            <div className={styles.sectionLabel}>图片</div>
            <div className={styles.imageGrid}>
              {images.map((img, idx) => (
                <div key={`${img.name}_${idx}`} className={styles.imageItem}>
                  <img src={img.url} alt={img.name} />
                  <button
                    className={styles.imageRemove}
                    onClick={() => handleRemoveImage(idx)}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
              {images.length < 9 && (
                <button className={styles.addImage} onClick={handlePickImage}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span className={styles.addImageText}>{images.length}/9</span>
                </button>
              )}
            </div>
          </div>

          <div className={styles.topicSection}>
            <div className={styles.topicSectionLabel}>选择话题（可选）</div>
            <div className={styles.topicList}>
              {TOPICS.map(t => (
                <button
                  key={t}
                  className={`${styles.topicTag} ${topic === t ? styles.active : ''}`}
                  onClick={() => handleToggleTopic(t)}
                >
                  # {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.draftBtn} onClick={handleSaveDraft}>
            存草稿
          </button>
          <span className={styles.charCount}>{content.length}/500</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className={styles.hiddenInput}
          onChange={handleFileChange}
        />

        {toast && <div className={styles.toast}>{toast}</div>}

        {confirmDiscardOpen && (
          <div className={styles.confirmOverlay} onClick={() => setConfirmDiscardOpen(false)}>
            <div className={styles.confirmSheet} onClick={(e) => e.stopPropagation()}>
              <div className={styles.confirmTitle}>放弃本次编辑？</div>
              <div className={styles.confirmDesc}>当前输入的内容不会保存，退出后将无法恢复。</div>
              <div className={styles.confirmActions}>
                <button className={styles.confirmCancelBtn} onClick={() => setConfirmDiscardOpen(false)}>继续编辑</button>
                <button className={styles.confirmDangerBtn} onClick={handleConfirmDiscard}>放弃编辑</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PublishModal;
