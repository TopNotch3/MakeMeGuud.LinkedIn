chrome.action.onClicked.addListener(async (tab) => {
    if (tab.url.includes("linkedin.com/in/")) {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    }
  });