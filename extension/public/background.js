// This function enables or disables the side panel based on the URL
const updatePanelState = async (tabId, url) => {
    if (url && url.startsWith("https://www.linkedin.com/in/")) {
      await chrome.sidePanel.setOptions({
        tabId,
        path: 'index.html',
        enabled: true
      });
    } else {
      // Disables the side panel on all other sites
      await chrome.sidePanel.setOptions({
        tabId,
        enabled: false
      });
    }
  };
  
  // Open the side panel when the action icon is clicked
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
  
  // Listen for when a tab is updated
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // We only care about the main page load completing
    if (changeInfo.status === 'complete') {
      updatePanelState(tabId, tab.url);
    }
  });