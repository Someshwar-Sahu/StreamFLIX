import React from 'react';
import styles from '../styles/AnimatedModal.module.css';

export default function AnimatedModal({
  isOpen,
  title = 'Confirmation',
  message,
  type = 'danger',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  children,
}) {
  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={`${styles.iconCircle} ${styles[type]}`}>
            <span className="material-symbols-outlined">
              {type === 'danger' ? 'delete' : 'info'}
            </span>
          </div>
          <h3 className={styles.title}>{title}</h3>
        </div>

        {message && <p className={styles.message}>{message}</p>}
        {children}

        <div className={styles.actions}>
          {onCancel && (
            <button className={styles.btnCancel} onClick={onCancel}>
              {cancelText}
            </button>
          )}
          {onConfirm && (
            <button className={styles.btnConfirm} onClick={onConfirm}>
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
