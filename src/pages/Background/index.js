console.log('Background script running');

// Function to check if a side panel exists for a given tab
async function sidePanel(tabId) {
  try {
    return await chrome.sidePanel.getOptions({ tabId });
  } catch (error) {
    console.log(`No side panel for tab ${tabId}:`, error);
    return null;
  }
}

// Function to toggle the side panel
async function toggleSidePanel(tabId) {
  console.log(`Attempting to toggle side panel for tab ${tabId}`);
  try {
    const panel = await sidePanel(tabId);
    if (panel) {
      console.log(`Closing side panel for tab ${tabId}`);
      await chrome.sidePanel.close({ tabId });
    } else {
      console.log(`Opening side panel for tab ${tabId}`);
      await chrome.sidePanel.setOptions({ tabId });
      await chrome.sidePanel.open({ tabId });
    }
  } catch (error) {
    console.error(`Error toggling side panel for tab ${tabId}:`, error);
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'processMessage') {
    // Here you would typically make an API call to Claude AI
    // For now, we'll just echo the message
    sendResponse({ reply: `Echo: ${request.message}` });
  } else if (request.action === 'getPageContent') {
    chrome.tabs.sendMessage(
      sender.tab.id,
      { action: 'getPageContent' },
      (response) => {
        sendResponse(response);
      }
    );
    return true;
  }
  return true;
});

chrome.action.onClicked.addListener(async (tab) => {
  console.log(`Extension icon clicked for tab ${tab.id}`);
  await toggleSidePanel(tab.id);
});

// Remove the tab change listener
// chrome.tabs.onActivated.addListener(async (activeInfo) => {
//   const tabId = activeInfo.tabId;
//   await toggleSidePanel(tabId);
// });
