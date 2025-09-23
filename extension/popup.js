document.getElementById('analyzeBtn').addEventListener('click', () => {
    // Send a message to the background script to start the process
    chrome.runtime.sendMessage({ action: "analyze" });
  });