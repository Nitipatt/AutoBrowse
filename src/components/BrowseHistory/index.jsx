import React from 'react';
import styles from './BrowseHistory.module.scss';

const BrowseHistory = ({
  history,
  currentUrl,
  onSelectHistory,
  onExit,
  onRemoveHistory,
  getMessageCount, // Add this prop
}) => {
  return (
    <div className={styles.browseHistoryContainer}>
      <div className={styles.browseHistoryHeader}>
        <h3>Browse History</h3>
        <button className={styles.exitButton} onClick={onExit}>
          Back to Chat
        </button>
      </div>
      <ul className={styles.historyList}>
        {history
          .filter(
            (item) => getMessageCount(item.url) > 0 || item.url === currentUrl
          )
          .map((item, index) => (
            <li
              key={index}
              className={`${styles.historyItem} ${
                item.url === currentUrl ? styles.active : ''
              }`}
            >
              <div
                className={styles.historyItemContent}
                onClick={() => onSelectHistory(item.url)}
              >
                <div className={styles.historyTextContent}>
                  <span title={item.title} className={styles.historyTitle}>
                    {item.title}
                  </span>
                  <span title={item.url} className={styles.historyUrl}>
                    {item.url}
                  </span>
                </div>
                <span className={styles.messageCount}>
                  {getMessageCount(item.url)} messages
                </span>
              </div>
              <button
                className={styles.removeButton}
                onClick={() => onRemoveHistory(item.url)}
              >
                &times;
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default BrowseHistory;
