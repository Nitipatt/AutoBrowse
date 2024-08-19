import React from 'react';
import SkeletonLoader from './SkeletonLoader';
import styles from './SkeletonChatMode.module.scss';

const SkeletonChatMode = () => {
  return (
    <div className={styles.skeletonChatMode}>
      <div className={styles.chatContainer}>
        <SkeletonLoader />
      </div>
      <div className={styles.inputArea}>
        <div className={styles.inputSkeleton}></div>
        <div className={styles.buttonSkeleton}></div>
      </div>
    </div>
  );
};

export default SkeletonChatMode;
