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
        ...(chatHistory[chatHistory.length - 1]?.role === 'assistant'
          ? chatHistory.slice(0, -1)
          : chatHistory),
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

export const summarizeChatHistory = async (apiKey, messages, model) => {
  console.log('Hello summarizeChatHistory');
  console.log('messages', messages);
  const messagesLog = messages.slice(0, -1);
  const lastMessage = messagesLog[messagesLog.length - 1];
  console.log('messagesLog', messagesLog);
  console.log('lastMessage', lastMessage);

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
          content:
            'Summarize the following conversation concisely, capturing the main points and context.',
        },
        {
          role: 'user',
          content: messagesLog
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
  const summary = result.choices[0].message.content;

  return [
    { role: 'system', content: `Previous conversation summary:\n${summary}` },
    lastMessage,
  ];
};
