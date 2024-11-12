import React, { useState, useEffect, useRef } from 'react';
import ChatContainer from './ChatContainer';
import ChatForm from '../ChatForm';
import {
  sendMessage,
  handleStreamingResponse,
  summarizeChatHistory,
} from '../../utils/api';
import { storage } from '../../utils/storage';

const ChatMode = ({
  pageContent,
  pageTitle,
  systemPrompt,
  model,
  anthropicApiKey,
  openaiApiKey,
  currentUrl,
  chatHistory,
  setChatHistory,
  summarizedChatHistory,
  setSummarizedChatHistory,
}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    // Set current messages based on the current URL
    setMessages(chatHistory[currentUrl] || []);
  }, [currentUrl, chatHistory]);

  const updateMessageLocally = (index, newContent) => {
    setMessages((prevMessages) => {
      const newMessages = prevMessages.slice(0, index + 1);
      newMessages[index] = { ...newMessages[index], content: newContent };
      setChatHistory((prevHistory) => ({
        ...prevHistory,
        [currentUrl]: newMessages,
      }));
      return newMessages;
    });
  };

  const sendEditedMessageToAPI = async (message, editIndex) => {
    await handleSendMessage(message, true, editIndex);
  };

  const handleSendMessage = async (message, isEdit = false, editIndex = -1) => {
    const apiKey = model.startsWith('claude-') ? anthropicApiKey : openaiApiKey;
    if (!apiKey) {
      setMessages([
        ...messages,
        {
          role: 'assistant',
          content: 'Please set your API key in the settings.',
          model: 'Assistant',
        },
      ]);
      return;
    }

    let newMessages;
    if (isEdit) {
      newMessages = messages.slice(0, editIndex + 1);
      newMessages[editIndex] = { ...newMessages[editIndex], content: message };
      newMessages.push({
        role: 'assistant',
        content: 'Thinking...',
        model: model,
      });
    } else {
      newMessages = [
        ...messages,
        { role: 'user', content: message },
        { role: 'assistant', content: 'Thinking...', model: model },
      ];
    }
    setMessages(newMessages);
    setChatHistory((prevHistory) => ({
      ...prevHistory,
      [currentUrl]: newMessages,
    }));

    // Scroll to bottom of chat container using ref
    if (chatContainerRef.current) {
      setTimeout(() => {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      }, 0);
    }

    try {
      setIsStreaming(true);
      const controller = new AbortController();
      setAbortController(controller);

      let summarizedHistory = summarizedChatHistory[currentUrl] || [];
      if (newMessages.length > 4 && !summarizedHistory.length) {
        summarizedHistory = await summarizeChatHistory(
          apiKey,
          newMessages,
          model
        );
        setSummarizedChatHistory((prev) => ({
          ...prev,
          [currentUrl]: summarizedHistory,
        }));
        storage.set({
          summarizedChatHistory: {
            ...summarizedChatHistory,
            [currentUrl]: summarizedHistory,
          },
        });
      }

      const response = await sendMessage(
        apiKey,
        systemPrompt,
        pageContent,
        summarizedHistory.length ? summarizedHistory : newMessages,
        message,
        model,
        controller.signal
      );

      await handleStreamingResponse(
        response,
        model,
        controller.signal,
        (accumulatedResponse) => {
          setMessages((prevMessages) => {
            const newMessages = [...prevMessages];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.content === 'Thinking...') {
              lastMessage.content = accumulatedResponse;
            } else {
              lastMessage.content += accumulatedResponse;
            }
            return newMessages;
          });
        }
      );
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Streaming was aborted');
      } else {
        console.error('Error:', error);
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: `An error occurred: ${error.message}`,
            model: model,
          },
        ]);
      }
    } finally {
      setIsStreaming(false);
      setAbortController(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      handleSendMessage(input);
      setInput('');
    }
  };

  const handleStopStreaming = () => {
    if (abortController) {
      abortController.abort();
    }
    setIsStreaming(false);
  };

  return (
    <>
      <ChatContainer
        messages={messages}
        updateMessageLocally={updateMessageLocally}
        sendEditedMessageToAPI={sendEditedMessageToAPI}
        pageTitle={pageTitle}
        ref={chatContainerRef}
      />
      <ChatForm
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        isStreaming={isStreaming}
        handleStopStreaming={handleStopStreaming}
      />
    </>
  );
};

export default ChatMode;
