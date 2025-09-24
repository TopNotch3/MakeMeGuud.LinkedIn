async function scrollToBottom() {
    let lastHeight = 0;
    let currentHeight = -1;
    while (lastHeight !== currentHeight) {
      lastHeight = document.body.scrollHeight;
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds for content to load
      currentHeight = document.body.scrollHeight;
    }
  }
  
  async function scrapeProfileData() {
    console.log("Starting scrape...");
  
    await scrollToBottom();
  
    // NOTE: LinkedIn's class names can be complex and may change.
    // These selectors are based on the current structure and may need updating.
    const headlineSelector = ".text-body-medium.break-words";
    const bioSelector = ".display-flex.ph5.pv3 .inline-show-more-text";
    const postsSelector = ".scaffold-finite-scroll__content .feed-shared-update-v2";
  
    const headline = document.querySelector(headlineSelector)?.innerText.trim() || null;
    const bio = document.querySelector(bioSelector)?.innerText.trim() || null;
  
    const postElements = document.querySelectorAll(postsSelector);
    let posts_text = "";
    postElements.forEach(post => {
      const postContent = post.querySelector(".update-components-text")?.innerText.trim();
      if (postContent) {
        posts_text += postContent + "\n---\n";
      }
    });
  
    const profileData = {
      headline: headline,
      bio: bio,
      posts_text: posts_text
    };
    
    // Send the data back to the background script
    chrome.runtime.sendMessage({ action: "scrapedData", data: profileData });
  }
  
  scrapeProfileData();