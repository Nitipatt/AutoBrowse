import * as anthropic from './anthropic';
import * as openai from './openai';

export const sendMessage = async (
  apiKey,
  systemPrompt,
  pageContent,
  chatHistory,
  message,
  model,
  signal
) => {
  if (model.startsWith('claude-')) {
    return anthropic.sendMessage(
      apiKey,
      systemPrompt,
      pageContent,
      chatHistory,
      message,
      model,
      signal
    );
  } else if (model.startsWith('gpt-')) {
    return openai.sendMessage(
      apiKey,
      systemPrompt,
      pageContent,
      chatHistory,
      message,
      model,
      signal
    );
  } else {
    throw new Error(`Unsupported model: ${model}`);
  }
};

export const handleStreamingResponse = async (
  response,
  currentModel,
  signal,
  updateMessageCallback
) => {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      let accumulatedResponse = '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsedData = JSON.parse(data);
            if (currentModel.startsWith('claude-')) {
              if (parsedData.type === 'content_block_delta') {
                accumulatedResponse += parsedData.delta.text;
              }
            } else if (currentModel.startsWith('gpt-')) {
              if (parsedData.choices && parsedData.choices[0].delta.content) {
                accumulatedResponse += parsedData.choices[0].delta.content;
              }
            }
          } catch (error) {
            console.error('Error parsing JSON:', error);
          }
        }
      }

      if (accumulatedResponse) {
        updateMessageCallback(accumulatedResponse);
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Streaming was aborted');
    } else {
      throw error;
    }
  } finally {
    reader.releaseLock();
  }
};

export const summarizeChatHistory = async (apiKey, messages, model) => {
  const provider = model.startsWith('claude-') ? anthropic : openai;
  return provider.summarizeChatHistory(apiKey, messages, model);
};
