import React, { forwardRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './ChatContainer.module.scss';
import SkeletonLoader from '../SkeletonLoader';
import icon128 from '../../assets/img/icon-128.png';
import classNames from 'classnames';

const ChatContainer = forwardRef(
  (
    { messages, updateMessageLocally, sendEditedMessageToAPI, pageTitle },
    ref
  ) => {
    const [editingIndex, setEditingIndex] = useState(-1);
    const [editContent, setEditContent] = useState('');
    const [copiedIndex, setCopiedIndex] = useState(-1);
    const [hoveredIndex, setHoveredIndex] = useState(-1);

    useEffect(() => {
      if (ref.current) {
        ref.current.scrollTop = ref.current.scrollHeight;
      }
    }, [messages, ref]);

    const handleEditClick = (index, content) => {
      setEditingIndex(index);
      setEditContent(content);
    };

    const handleEditSubmit = (e, index) => {
      e.preventDefault();
      updateMessageLocally(index, editContent);
      sendEditedMessageToAPI(editContent, index);
      setEditingIndex(-1);
    };

    const handleCopyClick = (content, index) => {
      // Create a temporary element to hold the HTML content
      const tempElement = document.createElement('div');
      tempElement.innerHTML = content;

      // Extract the text content, preserving line breaks
      const textContent = tempElement.innerText || tempElement.textContent;

      // Copy the text content to clipboard
      navigator.clipboard.writeText(textContent).then(() => {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(-1), 2000); // Reset after 2 seconds
      });
    };

    const messageVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    };

    return (
      <div className={styles.chatContainerWrapper}>
        <div className={styles.chatHeader}>
          <h2 className={styles.chatTitle} title={pageTitle || 'Chat'}>
            {pageTitle || 'Chat'}
          </h2>
        </div>
        <div id="chat-container" className={styles.chatContainer} ref={ref}>
          {(messages.length === 0
            ? [
                {
                  role: 'assistant',
                  content: 'Hello, I am page assistant, How can I help you?',
                  model: 'Assistant', // Add a default model for the initial message
                },
              ]
            : messages
          ).map((msg, index) => (
            <motion.div
              key={index}
              className={`${styles.message} ${styles[msg.role]}`}
              initial="hidden"
              animate="visible"
              variants={messageVariants}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(-1)}
            >
              <div className={styles.messageHeader}>
                <div className={classNames(styles.messageIcon, msg.role)}>
                  {msg.role === 'user' ? (
                    <svg>
                      <use xlinkHref={`#${msg.role}-icon`} />
                    </svg>
                  ) : (
                    <img src={icon128} alt="icon" />
                  )}
                </div>
                {msg.role === 'assistant' && (
                  <span className={styles.modelName}>{msg.model}</span>
                )}
              </div>
              {editingIndex === index ? (
                <form onSubmit={(e) => handleEditSubmit(e, index)}>
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className={styles.editInput}
                  />
                </form>
              ) : (
                <>
                  <div className={styles.iconContainer}>
                    {msg.role === 'user' && (
                      <svg
                        className={styles.editIcon}
                        onClick={() => handleEditClick(index, msg.content)}
                      >
                        <use xlinkHref="#edit-icon" />
                      </svg>
                    )}
                    {msg.role === 'assistant' &&
                      msg.content !== 'Thinking...' &&
                      (hoveredIndex === index || copiedIndex === index) && (
                        <svg
                          className={styles.copyIcon}
                          onClick={() => handleCopyClick(msg.content, index)}
                        >
                          <use
                            xlinkHref={
                              copiedIndex === index
                                ? '#check-icon'
                                : '#copy-icon'
                            }
                          />
                        </svg>
                      )}
                  </div>
                  {msg.role === 'assistant' && msg.content === 'Thinking...' ? (
                    <SkeletonLoader />
                  ) : (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: msg.content || 'Thinking...',
                      }}
                    ></span>
                  )}
                </>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }
);

export default ChatContainer;
