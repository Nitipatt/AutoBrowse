const BASE_MODEL_VERSION = '2023-06-01';

export const sendMessage = async (
  apiKey,
  systemPrompt,
  pageContent,
  chatHistory,
  message,
  model,
  signal
) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': BASE_MODEL_VERSION,
    },
    body: JSON.stringify({
      model: model,
      system: `${systemPrompt}\n\nPage content: ${pageContent}`,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
      max_tokens: 4096,
      stream: true,
    }),
    signal, // Add this line to pass the AbortSignal
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
};

const summarizeChatHistory = async (apiKey, messages, model) => {
  if (messages.length <= 10) {
    return messages.map((msg) => `${msg.role}: ${msg.content}`).join('\n');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': BASE_MODEL_VERSION,
    },
    body: JSON.stringify({
      model: model,
      system:
        'Summarize the following conversation concisely, capturing the main points and context.',
      messages: [
        {
          role: 'user',
          content: messages
            .map((msg) => `${msg.role}: ${msg.content}`)
            .join('\n'),
        },
      ],
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return `Previous conversation summary:\n${result.content[0].text}\n\nPlease consider this context for your response.`;
};
