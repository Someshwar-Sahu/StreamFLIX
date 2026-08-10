import React, { createContext, useContext, useState, useCallback } from 'react';
import styles from '../styles/Toast.module.css';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', title = null, duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    const defaultTitle =
      title ||
      (type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Notice' : 'Information');

    const newToast = { id, message, type, title: defaultTitle, duration };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
            <div className={styles.iconWrap}>
              <span className="material-symbols-outlined">
                {t.type === 'success'
                  ? 'check_circle'
                  : t.type === 'error'
                  ? 'error'
                  : t.type === 'warning'
                  ? 'warning'
                  : 'info'}
              </span>
            </div>
            <div className={styles.content}>
              <div className={styles.title}>{t.title}</div>
              <div className={styles.message}>{t.message}</div>
            </div>
            <button className={styles.closeBtn} onClick={() => removeToast(t.id)}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
            </button>
            <div className={styles.progressBar} style={{ animationDuration: `${t.duration}ms` }} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return { showToast: (msg) => console.log('[TOAST]', msg) };
  }
  return context;
}
