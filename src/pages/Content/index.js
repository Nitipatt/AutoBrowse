console.log('Content script running');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  if (request.action === 'getPageContent') {
    console.log('Getting page content');
    const content = document.body.innerText;
    sendResponse({ content: content });
  }
  if (request.action === 'getPageTitle') {
    console.log('Getting page title');
    const title = document.title;
    sendResponse({ title: title });
  }
  return true; // Keep the message channel open for asynchronous response
});
