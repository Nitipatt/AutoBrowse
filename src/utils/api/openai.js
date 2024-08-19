const CHEAP_MODEL = 'gpt-4o-mini';

export const sendMessage = async (
  apiKey,
  systemPrompt,
  pageContent,
  chatHistory,
  message,
  model,
  signal
) => {
  console.log('chatHistory', chatHistory);
  console.log('message', message);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: `${systemPrompt}\n\nPage content: ${pageContent}`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      max_tokens: 4096,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
};

const summarizeChatHistory = async (apiKey, messages) => {
  if (messages.length <= 10) {
    return messages.map((msg) => `${msg.role}: ${msg.content}`).join('\n');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: CHEAP_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'Summarize the following conversation concisely, capturing the main points and context.',
        },
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
  return `Previous conversation summary:\n${result.choices[0].message.content}\n\nPlease consider this context for your response.`;
};
