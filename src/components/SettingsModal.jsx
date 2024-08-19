import React, { useState } from 'react';
import styles from './SettingsModal.module.scss';

const SettingsModal = ({
  anthropicApiKey,
  setAnthropicApiKey,
  openaiApiKey,
  setOpenaiApiKey,
  systemPrompt,
  setSystemPrompt,
  model,
  setModel,
  handleSaveSettings,
  setShowSettings,
  activeTab,
  setActiveTab,
}) => {
  const handleSave = (e) => {
    handleSaveSettings(e, activeTab);
  };

  return (
    <div id="settings-modal" className={styles.settingsModal}>
      <div>
        <h3 className={styles.settingsTitle}>Settings</h3>
        <div className={styles.tabs}>
          <button
            className={`${styles.tabButton} ${
              activeTab === 'anthropic' ? styles.active : ''
            }`}
            onClick={() => setActiveTab('anthropic')}
          >
            Anthropic
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === 'openai' ? styles.active : ''
            }`}
            onClick={() => setActiveTab('openai')}
          >
            OpenAI
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === 'gemini' ? styles.active : ''
            }`}
            onClick={() => setActiveTab('gemini')}
          >
            Gemini
          </button>
        </div>
        <form onSubmit={handleSave} className={styles.settingsForm}>
          {activeTab === 'anthropic' && (
            <>
              <div>
                <label htmlFor="anthropic-model">Model:</label>
                <select
                  id="anthropic-model"
                  value={model.startsWith('claude-') ? model : ''}
                  onChange={(e) => setModel(e.target.value)}
                >
                  <option value="claude-3-5-sonnet-20240620">
                    claude-3-5-sonnet-20240620
                  </option>
                  <option value="claude-3-opus-20240229">
                    claude-3-opus-20240229
                  </option>
                  <option value="claude-3-sonnet-20240229">
                    claude-3-sonnet-20240229
                  </option>
                  <option value="claude-3-haiku-20240307">
                    claude-3-haiku-20240307
                  </option>
                </select>
              </div>
              <div>
                <label htmlFor="anthropic-api-key">Anthropic API Key:</label>
                <input
                  type="password"
                  id="anthropic-api-key"
                  value={anthropicApiKey}
                  onChange={(e) => setAnthropicApiKey(e.target.value)}
                />
              </div>
            </>
          )}
          {activeTab === 'gemini' && (
            <div className={styles.comingSoon}>Coming soon</div>
          )}
          {activeTab === 'openai' && (
            <>
              <div>
                <label htmlFor="openai-model">Model:</label>
                <select
                  id="openai-model"
                  value={model.startsWith('gpt-') ? model : ''}
                  onChange={(e) => setModel(e.target.value)}
                >
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                  <option value="gpt-4-turbo">gpt-4-turbo</option>
                </select>
              </div>
              <div>
                <label htmlFor="openai-api-key">OpenAI API Key:</label>
                <input
                  type="password"
                  id="openai-api-key"
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                />
              </div>
            </>
          )}
          <div>
            <label htmlFor="system-prompt">System Prompt:</label>
            <textarea
              id="system-prompt"
              rows="6"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            ></textarea>
          </div>
          <div className={styles.buttonGroup}>
            <button type="submit">Save</button>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className={styles.closeSettings}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
