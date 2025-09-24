import { useState, useEffect } from 'react';
// We don't need the supabase-js client here, as we are just handling the token.

// Define the structure of our analysis output
type AnalysisOutput = {
  immediate_steps: string[];
  suggestions: string[];
};

function App() {
  const [uiState, setUiState] = useState('idle'); // idle, loading, results
  const [analysis, setAnalysis] = useState<AnalysisOutput | null>(null);
  const [authToken, setAuthToken] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Simple handler for the auth token input
  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAuthToken(e.target.value);
  };

  const handleLogin = () => {
    if (authToken.trim() !== '') {
      setIsLoggedIn(true);
    }
  };

  // <<< --- START OF NEW/UPDATED LOGIC --- >>>

  // This function is called when the user clicks the "Analyze" button.
  // Its job is to inject our content scraper into the active LinkedIn tab.
  const handleAnalyzeClick = async () => {
    setUiState('loading');
    
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Ensure we have a tab ID to target
    if (tab.id) {
      // Execute the content script in the active tab
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      // Note: We don't need to do anything in the callback here.
      // The content script will send a message back to us when it's done.
    }
  };

  // This hook sets up a listener that waits for messages from our content script.
  // This is how the UI receives the scraped data.
  useEffect(() => {
    const messageListener = (message: any) => {
      // We only care about messages with the action "scrapedData"
      if (message.action === "scrapedData") {
        
        // Once we get the data, we call our backend API
        fetch("http://127.0.0.1:8000/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // We include the user's auth token for our secure endpoint
            "Authorization": `Bearer ${authToken}`
          },
          body: JSON.stringify(message.data),
        })
        .then(response => {
          if (!response.ok) {
             // If the response is not OK, parse the error message
             return response.json().then(err => { throw new Error(err.detail || 'Analysis failed') });
          }
          return response.json();
        })
        .then((data: AnalysisOutput) => {
          setAnalysis(data);
          setUiState('results');
        })
        .catch(error => {
          console.error("Error analyzing profile:", error);
          setUiState('idle'); // Reset UI on error
          alert(`Analysis failed: ${error.message}. Please check your token and try again.`);
        });
      }
    };
    
    // Add the listener when the component mounts
    chrome.runtime.onMessage.addListener(messageListener);
    
    // Clean up the listener when the component unmounts
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [authToken]); // The hook depends on authToken to include it in the fetch call

  // <<< --- END OF NEW/UPDATED LOGIC --- >>>


  if (!isLoggedIn) {
    return (
      <div className="container">
        <h3>Login Required</h3>
        <p>Log in to the web app, click "Show My Access Token," and paste it here.</p>
        <input 
          type="password" 
          placeholder="Paste your access token"
          value={authToken}
          onChange={handleTokenChange}
        />
        <button onClick={handleLogin}>Submit Token</button>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>AI Profile Coach</h2>
      {uiState === 'idle' && (
        <button onClick={handleAnalyzeClick}>Analyze My Profile</button>
      )}

      {uiState === 'loading' && (
        <div className="loading-state">
            <div className="spinner"></div>
            <p>Analyzing... The page will scroll automatically.</p>
        </div>
      )}

      {uiState === 'results' && analysis && (
        <div>
          <div className="results-section">
            <h3>Immediate Steps</h3>
            <ul>
              {analysis.immediate_steps.map((step, index) => <li key={index}>{step}</li>)}
            </ul>
          </div>
          <div className="results-section">
            <h3>Suggestions</h3>
            <ul>
              {analysis.suggestions.map((suggestion, index) => <li key={index}>{suggestion}</li>)}
            </ul>
          </div>
          <button onClick={() => setUiState('idle')}>Analyze Again</button>
        </div>
      )}
    </div>
  );
}

export default App;