chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "analyze") {
      console.log("Analyze message received from popup.");
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        // First, make sure we are on a LinkedIn profile page
        if (tabs[0].url.includes("linkedin.com/in/")) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ['content.js']
          });
        } else {
          console.log("Not a LinkedIn profile page.");
        }
      });
    } 
    // Listen for the scraped data from the content script
    else if (request.action === "scrapedData") {
      console.log("Received data from content script. Sending to backend...");
      const profileData = request.data;
      
      // Send the data to your local FastAPI backend
      fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      })
      .then(response => response.json())
      .then(data => {
        console.log("Success! Analysis from backend:", data);
        // In a future milestone, we'll send this data to the UI.
      })
      .catch(error => {
        console.error("Error sending data to backend:", error);
      });
    }
  });