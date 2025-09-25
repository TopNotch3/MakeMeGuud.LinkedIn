// --- HELPER FUNCTION (unchanged) ---
function waitForElement(selector: string, timeout = 5000): Promise<Element> {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const element = document.querySelector(selector);
      if (element) {
        clearInterval(interval);
        resolve(element);
      }
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      reject(new Error(`Element with selector "${selector}" not found within ${timeout}ms.`));
    }, timeout);
  });
}

// --- UPDATED SCRAPER FUNCTION ---
async function scrapeProfileData() {
  console.log("Starting scrape... Waiting for elements to appear.");

  try {
    // --- FINAL, MORE RELIABLE SELECTORS ---
    // The headline selector is usually stable.
    const headlineSelector = ".text-body-medium.break-words";
    // This new selector finds the element with id="about", then finds the text container right after it.
    // This is much more reliable than using the random class names.
    const bioSelector = ".artdeco-card.pv-profile-card .inline-show-more-text";
    const postsSelector = ".scaffold-finite-scroll__content .feed-shared-update-v2";

    // Wait for the main profile elements to be ready
    await waitForElement(headlineSelector);
    
    await scrollToBottom();
    
    const headlineElement = document.querySelector(headlineSelector) as HTMLElement | null;
    const headline = headlineElement?.innerText.trim() || null;

    const bioElement = document.querySelector(bioSelector) as HTMLElement | null;
    const bio = bioElement?.innerText.trim() || null;

    const postElements = document.querySelectorAll(postsSelector);
    let posts_text = "";
    postElements.forEach(post => {
      const postContentElement = post.querySelector(".update-components-text") as HTMLElement | null;
      const postContent = postContentElement?.innerText.trim();
      if (postContent) {
        posts_text += postContent + "\n---\n";
      }
    });

    const profileData = {
      headline: headline,
      bio: bio,
      posts_text: posts_text
    };
    
    console.log("--- Scraped Profile Data ---", profileData);
    chrome.runtime.sendMessage({ action: "scrapedData", data: profileData });

  } catch (error) {
    console.error("Scraping failed:", error);
    chrome.runtime.sendMessage({ action: "scrapeFailed", error: (error as Error).message });
  }
}

// --- UNCHANGED SCROLL FUNCTION ---
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

// Start the process
scrapeProfileData();