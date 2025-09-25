// This function now resolves with 'null' on timeout instead of failing.
function waitForElement(selector, timeout = 3000) {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const element = document.querySelector(selector);
      if (element) {
        clearInterval(interval);
        resolve(element);
      }
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      resolve(null); // Resolve with null instead of rejecting the promise
    }, timeout);
  });
}

// This is the updated, more robust scraper function.
async function scrapeProfileData() {
  console.log("Starting scrape... Waiting for elements to appear.");
  try {
    const headlineSelector = ".text-body-medium.break-words";
    const bioSelector = "#about + div .inline-show-more-text";
    const postsSelector = ".scaffold-finite-scroll__content .feed-shared-update-v2";

    // We still wait for the headline as it should always be present.
    await waitForElement(headlineSelector);
    
    // We scroll to the bottom to load all posts.
    await scrollToBottom();
    
    // --- START OF FIX ---
    // We now handle each piece of data individually.
    const headlineElement = await waitForElement(headlineSelector);
    const headline = headlineElement ? headlineElement.innerText.trim() : null;

    const bioElement = await waitForElement(bioSelector);
    const bio = bioElement ? bioElement.innerText.trim() : null; // Gracefully handles a missing bio
    
    const postElements = document.querySelectorAll(postsSelector);
    let posts_text = "";
    postElements.forEach(post => {
      const postContent = post.querySelector(".update-components-text")?.innerText.trim();
      if (postContent) {
        posts_text += postContent + "\n---\n";
      }
    });
    // --- END OF FIX ---

    const profileData = {
      headline: headline,
      bio: bio,
      posts_text: posts_text
    };
    
    console.log("--- Scraped Profile Data ---", profileData); // Check this log to see what was found
    chrome.runtime.sendMessage({ action: "scrapedData", data: profileData });

  } catch (error) {
    console.error("Scraping failed:", error);
    chrome.runtime.sendMessage({ action: "scrapeFailed", error: error.message });
  }
}

async function scrollToBottom() {
  let lastHeight = 0;
  let currentHeight = -1;
  while (lastHeight !== currentHeight) {
    lastHeight = document.body.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise(resolve => setTimeout(resolve, 2000));
    currentHeight = document.body.scrollHeight;
  }
}

scrapeProfileData();