import { useEffect } from 'react';
import styles from './Modal.module.css';

function Modal({ open, onClose, title, children, hideFooter = false, hideCloseButton = false }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.backdrop} />
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={`${styles.header} ${hideCloseButton ? styles.headerCentered : ''}`}>
          <h2 className={styles.title}>{title}</h2>
          {!hideCloseButton && (
            <button onClick={onClose} className={styles.closeBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <div className={styles.body}>
          {children}
        </div>
        {!hideFooter && (
          <div className={styles.footer}>
            <button onClick={onClose} className={styles.confirmBtn}>
              我知道了
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
