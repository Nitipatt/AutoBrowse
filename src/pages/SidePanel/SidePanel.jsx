import React, { useState, useEffect } from 'react';
import styles from './SidePanel.module.scss';
import Header from '../../components/Header';
import ChatMode from '../../components/ChatMode';
import SettingsModal from '../../components/SettingsModal';
import { storage } from '../../utils/storage';
import { isExtensionEnvironment } from '../../utils/environment';
import BrowseHistory from '../../components/BrowseHistory';
import SkeletonChatMode from '../../components/SkeletonChatMode';

const SidePanel = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [anthropicApiKey, setAnthropicApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(
    ` Role: You are an expert assistant who provides detailed and accurate answers about the content of the current web page.
      Task:
      First, thoroughly comprehend the content of the web page.
      When answering the user's question, consider the context of the page and the query step by step.
      If additional research is needed to answer the question fully, use both the page content and the user's query to guide your research.
      Specify which parts of your response are links and which are not.
      Provide a detailed, contextually accurate response that aligns with the user's language and instructions, without describing your process steps.
      Formatting:
      Use HTML tags to structure your answer.
      Incorporate HTML anchor tags for links, ensuring they open in a new tab.`
  );
  const [model, setModel] = useState('claude-3-5-sonnet-20240620');
  const [pageContent, setPageContent] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [activeTab, setActiveTab] = useState('anthropic');
  const [browseHistory, setBrowseHistory] = useState([]);
  const [showBrowseHistory, setShowBrowseHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPageContent = async () => {
      if (isExtensionEnvironment()) {
        try {
          const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          if (tab) {
            setCurrentUrl(tab.url);
            setPageTitle(tab.title);
            await sendMessageToContentScript(tab.id);

            // Update browse history when a new tab is loaded
            updateBrowseHistory(tab.url, tab.title);
          } else {
            console.error('No active tab found');
            setPageContent(
              'No active tab found. Please make sure you have an active tab open.'
            );
          }
        } catch (error) {
          console.error('Error fetching page content:', error);
          setPageContent(
            'Error fetching page content. Please refresh the page and try again.'
          );
        }
      } else {
        setPageContent(
          'Not in extension environment. This feature is only available when running as a browser extension.'
        );
      }
    };

    const sendMessageToContentScript = async (tabId) => {
      try {
        const contentResponse = await chrome.tabs.sendMessage(tabId, {
          action: 'getPageContent',
        });
        const titleResponse = await chrome.tabs.sendMessage(tabId, {
          action: 'getPageTitle',
        });

        if (contentResponse && contentResponse.content) {
          setPageContent(contentResponse.content);
        } else {
          throw new Error('Invalid content response from content script');
        }

        if (titleResponse && titleResponse.title) {
          setPageTitle(titleResponse.title);
          console.log('Page title:', titleResponse.title);
        } else {
          console.log('Unable to retrieve page title');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        setPageContent(
          'Error: Unable to communicate with the page. The content script may not be injected. Please refresh the page and try again.'
        );
      }
    };

    // Load settings and model from storage
    storage.get(
      [
        'anthropicApiKey',
        'openaiApiKey',
        'systemPrompt',
        'model',
        'selectedProvider',
        'activeTab',
      ],
      (result) => {
        if (result.anthropicApiKey) setAnthropicApiKey(result.anthropicApiKey);
        if (result.openaiApiKey) setOpenaiApiKey(result.openaiApiKey);
        if (result.systemPrompt) setSystemPrompt(result.systemPrompt);
        if (result.model) setModel(result.model);
        if (result.activeTab) setActiveTab(result.activeTab);
      }
    );

    // Load browse history from storage
    storage.get(['browseHistory'], (result) => {
      if (result.browseHistory) setBrowseHistory(result.browseHistory);
    });

    // Load chat history from storage when component mounts
    storage.get(['chatHistory'], (result) => {
      if (result.chatHistory) {
        setChatHistory(result.chatHistory);
      }
    });

    fetchPageContent();

    // Set up listener for URL changes
    const urlChangeListener = (tabId, changeInfo, tab) => {
      if (
        changeInfo.status === 'complete' &&
        tab.active &&
        tab.url !== currentUrl
      ) {
        setCurrentUrl(tab.url);
        setPageTitle(tab.title);
        setIsLoading(false); // Disable loading when URL changes completely

        // Update browse history when URL changes
        updateBrowseHistory(tab.url, tab.title);
      }
    };

    if (isExtensionEnvironment()) {
      chrome.tabs.onUpdated.addListener(urlChangeListener);
    }

    // Clean up listener on component unmount
    return () => {
      if (isExtensionEnvironment()) {
        chrome.tabs.onUpdated.removeListener(urlChangeListener);
      }
    };
  }, [currentUrl]);

  // Updated updateBrowseHistory function
  const updateBrowseHistory = (url, title) => {
    // Check if the URL and title are not empty
    if (url && title && url.trim() !== '' && title.trim() !== '') {
      setBrowseHistory((prevHistory) => {
        const existingIndex = prevHistory.findIndex((item) => item.url === url);
        if (existingIndex !== -1) {
          // Move existing entry to the top
          const updatedHistory = [
            prevHistory[existingIndex],
            ...prevHistory.slice(0, existingIndex),
            ...prevHistory.slice(existingIndex + 1),
          ];
          return updatedHistory.slice(0, 10); // Keep only the last 10 entries
        } else {
          // Add new entry at the top
          return [{ url, title }, ...prevHistory].slice(0, 10);
        }
      });
    }
  };

  useEffect(() => {
    // Save browse history to storage whenever it changes
    storage.set({ browseHistory });
  }, [browseHistory]);

  const handleClearHistory = () => {
    storage.remove('chatHistory', () => {
      setChatHistory({}); // Clear the local state
      console.log('Chat history cleared');
    });
  };

  const handleSaveSettings = (e, newActiveTab) => {
    e.preventDefault();
    const currentProvider = newActiveTab;
    const currentApiKey =
      currentProvider === 'anthropic' ? anthropicApiKey : openaiApiKey;

    storage.set(
      {
        anthropicApiKey,
        openaiApiKey,
        systemPrompt,
        model,
        selectedProvider: currentProvider,
        activeTab: newActiveTab,
      },
      () => {
        setShowSettings(false);
        setActiveTab(newActiveTab);
        // Update the current model based on the selected provider
        if (currentProvider === 'anthropic' && !model.startsWith('claude-')) {
          setModel('claude-3-5-sonnet-20240620'); // Default Anthropic model
        } else if (currentProvider === 'openai' && !model.startsWith('gpt-')) {
          setModel('gpt-4-turbo'); // Default OpenAI model
        }
      }
    );

    // Update the apiKey state based on the selected provider
    if (currentProvider === 'anthropic') {
      setAnthropicApiKey(currentApiKey);
    } else if (currentProvider === 'openai') {
      setOpenaiApiKey(currentApiKey);
    }
  };

  const handleSelectHistory = async (url) => {
    const selectedHistory = browseHistory.find((item) => item.url === url);
    if (selectedHistory) {
      // If the selected URL is the same as the current URL, don't set loading to true
      if (url !== currentUrl) {
        setIsLoading(true);
      }
      setCurrentUrl(selectedHistory.url);
      setPageTitle(selectedHistory.title);
      setShowBrowseHistory(false);

      // Fetch the page content for the selected history item
      if (isExtensionEnvironment()) {
        try {
          const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          if (tab) {
            // Only update the tab if the URL is different
            if (tab.url !== selectedHistory.url) {
              await chrome.tabs.update(tab.id, { url: selectedHistory.url });
              // Wait for the page to load
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            setIsLoading(false);
          } else {
            console.error('No active tab found');
            setPageContent(
              'No active tab found. Please make sure you have an active tab open.'
            );
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Error fetching page content:', error);
          setPageContent(
            'Error fetching page content. Please refresh the page and try again.'
          );
          setIsLoading(false);
        }
      } else {
        setPageContent(
          'Not in extension environment. This feature is only available when running as a browser extension.'
        );
        setIsLoading(false);
      }
    }
  };

  const handleExitBrowseHistory = () => {
    setShowBrowseHistory(false);
  };

  const handleRemoveHistory = (url) => {
    setBrowseHistory((prevHistory) => {
      const updatedHistory = prevHistory.filter((item) => item.url !== url);
      // Save the updated history to storage
      storage.set({ browseHistory: updatedHistory });
      return updatedHistory;
    });
  };

  // Add this function to count messages for each URL
  const getMessageCountForUrl = (url) => {
    return chatHistory[url] ? chatHistory[url].length : 0;
  };

  return (
    <div className={styles.container}>
      <Header
        onClearHistory={handleClearHistory}
        setShowSettings={setShowSettings}
        onExitBrowseHistory={handleExitBrowseHistory}
        onToggleBrowseHistory={() => setShowBrowseHistory(!showBrowseHistory)}
      />
      {showBrowseHistory ? (
        <BrowseHistory
          history={browseHistory}
          currentUrl={currentUrl}
          onSelectHistory={handleSelectHistory}
          onExit={handleExitBrowseHistory}
          onRemoveHistory={handleRemoveHistory}
          getMessageCount={getMessageCountForUrl} // Add this line
        />
      ) : isLoading ? (
        <SkeletonChatMode />
      ) : (
        <ChatMode
          pageContent={pageContent}
          pageTitle={pageTitle}
          systemPrompt={systemPrompt}
          model={model}
          anthropicApiKey={anthropicApiKey}
          openaiApiKey={openaiApiKey}
          currentUrl={currentUrl}
          chatHistory={chatHistory}
          setChatHistory={setChatHistory}
        />
      )}
      {showSettings && (
        <SettingsModal
          anthropicApiKey={anthropicApiKey}
          setAnthropicApiKey={setAnthropicApiKey}
          openaiApiKey={openaiApiKey}
          setOpenaiApiKey={setOpenaiApiKey}
          systemPrompt={systemPrompt}
          setSystemPrompt={setSystemPrompt}
          model={model}
          setModel={setModel}
          handleSaveSettings={handleSaveSettings}
          setShowSettings={setShowSettings}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}

      {/* SVG definitions */}
      <svg xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }}>
        <symbol id="user-icon" viewBox="0 0 24 24">
          <path d="M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM5 12c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2h-1.1C16.6 14.2 14.4 15 12 15s-4.6-.8-5.9-3H5z" />
        </symbol>
        <symbol id="assistant-icon" viewBox="0 0 24 24">
          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2zM7.5 13a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
        </symbol>
        <symbol id="edit-icon" viewBox="0 0 24 24">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
        </symbol>
        <symbol id="copy-icon" viewBox="0 0 24 24">
          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2v-14c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
        </symbol>
        <symbol id="check-icon" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </symbol>
      </svg>
    </div>
  );
};

export default SidePanel;
