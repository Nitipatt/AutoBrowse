import React, { useState, useEffect, useRef } from 'react';
import styles from './ChatForm.module.scss';

const ChatForm = ({
  input,
  setInput,
  handleSubmit,
  isStreaming,
  handleStopStreaming,
}) => {
  const inputRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [newPrompt, setNewPrompt] = useState('');

  useEffect(() => {
    // Load saved prompts from storage
    chrome.storage.sync.get(['savedPrompts'], (result) => {
      if (result.savedPrompts) {
        setSavedPrompts(result.savedPrompts);
      }
    });
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handlePromptSelect = (prompt) => {
    setInput(prompt);
    setIsMenuOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleAddPrompt = () => {
    if (newPrompt.trim()) {
      const updatedPrompts = [...savedPrompts, newPrompt.trim()];
      setSavedPrompts(updatedPrompts);
      setNewPrompt('');
      chrome.storage.sync.set({ savedPrompts: updatedPrompts });
    }
  };

  const handleRemovePrompt = (index) => {
    const updatedPrompts = savedPrompts.filter((_, i) => i !== index);
    setSavedPrompts(updatedPrompts);
    chrome.storage.sync.set({ savedPrompts: updatedPrompts });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!isStreaming) {
      handleSubmit(e);
    } else {
      handleStopStreaming();
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className={styles.chatForm}>
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className={styles.userInput}
        />
        <button
          type="button"
          onClick={toggleMenu}
          className={styles.kebabButton}
          aria-label="Quick prompts"
        >
          ⋮
        </button>
        {isMenuOpen && (
          <div className={styles.dropdownMenu}>
            {savedPrompts.map((prompt, index) => (
              <div key={index} className={styles.promptItem}>
                <button
                  type="button"
                  onClick={() => handlePromptSelect(prompt)}
                  className={styles.promptButton}
                >
                  {prompt}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemovePrompt(index)}
                  className={styles.removePromptButton}
                >
                  ×
                </button>
              </div>
            ))}
            <div className={styles.addPromptForm}>
              <input
                type="text"
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="Add new prompt"
                className={styles.newPromptInput}
              />
              <button
                type="button"
                onClick={handleAddPrompt}
                className={styles.addPromptButton}
              >
                +
              </button>
            </div>
          </div>
        )}
      </div>
      <button
        type="submit"
        className={`${styles.submitButton} ${
          isStreaming ? styles.stopButton : ''
        }`}
      >
        {isStreaming ? <div className={styles.stopIcon}></div> : 'Send'}
      </button>
    </form>
  );
};

export default ChatForm;
