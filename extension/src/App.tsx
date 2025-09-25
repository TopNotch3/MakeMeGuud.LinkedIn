import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';

// Define the structure of our analysis output
type AnalysisOutput = {
  immediate_steps: string[];
  suggestions: string[];
};

function App() {
  const [uiState, setUiState] = useState('idle'); // idle, loading, questionnaire, results
  const [analysis, setAnalysis] = useState<AnalysisOutput | null>(null);
  const [authToken, setAuthToken] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // State for the questionnaire form
  const [careerGoal, setCareerGoal] = useState('');
  const [projects, setProjects] = useState('');
  const [skills, setSkills] = useState('');

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAuthToken(e.target.value);
  };
  
  const handleLogin = () => {
    if (authToken.trim() !== '') {
      setIsLoggedIn(true);
    }
  };

  const handleAnalyzeClick = async () => {
    setUiState('loading');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    }
  };

  const handleQuestionnaireSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setUiState('loading');
    const formData = { careerGoal, projects, skills };

    try {
      const response = await fetch("http://127.0.0.1:8000/generate-from-answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to generate steps.');
      }
      const data: AnalysisOutput = await response.json();
      setAnalysis(data);
      setUiState('results');
    } catch (error: any) {
      console.error("Error submitting questionnaire:", error);
      alert(`Error: ${error.message}`);
      setUiState('questionnaire');
    }
  };

// In extension/src/App.tsx
useEffect(() => {
  const messageListener = async (message: any) => {
    if (message.action === "scrapedData") {
      // ... This part is the same as before
      try {
        const response = await fetch("http://127.0.0.1:8000/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
          },
          body: JSON.stringify(message.data),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.detail || 'Analysis failed.');
        }
        const result = await response.json();

        if (result.type === 'questionnaire_needed') {
          setUiState('questionnaire');
        } else {
          setAnalysis(result.data);
          setUiState('results');
        }
      } catch (error: any) {
        console.error("Error analyzing profile:", error);
        alert(`Analysis failed: ${error.message}.`);
        setUiState('idle');
      }
    } 
    // --- NEW ERROR HANDLING LOGIC ---
    else if (message.action === "scrapeFailed") {
      console.error("Scraping failed:", message.error);
      alert(`Could not scrape the page. The layout might have changed. Error: ${message.error}`);
      setUiState('idle'); // Reset the UI
    }
  };
  
  chrome.runtime.onMessage.addListener(messageListener);
  
  return () => {
    chrome.runtime.onMessage.removeListener(messageListener);
  };
}, [authToken]);

  if (!isLoggedIn) {
    return (
      <div className="container">
        <h3>Login Required</h3>
        <p>Log in to the web app, click "Show My Access Token," and paste it here.</p>
        <input type="password" placeholder="Paste your access token" value={authToken} onChange={handleTokenChange} />
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
        <div><p>Analyzing... The page will scroll automatically.</p></div>
      )}

      {uiState === 'questionnaire' && (
         <div className="questionnaire-form">
            <h3>Tell Me More About You</h3>
            <p>Your profile is a bit sparse. Let's fill in the blanks to generate some foundational steps.</p>
            <form onSubmit={handleQuestionnaireSubmit}>
              <label>What is your primary career goal?</label>
              <input type="text" value={careerGoal} onChange={(e) => setCareerGoal(e.target.value)} required />
    
              <label>Describe a project you're proud of.</label>
              <textarea value={projects} onChange={(e) => setProjects(e.target.value)} required></textarea>
    
              <label>What are your top 3-5 skills?</label>
              <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} required />
              
              <button type="submit">Generate My Profile Steps</button>
            </form>
          </div>
      )}

      {uiState === 'results' && analysis && (
        <div>
          <div className="results-section">
            <h3>Immediate Steps</h3>
            <ul>{analysis.immediate_steps.map((step, index) => <li key={index}>{step}</li>)}</ul>
          </div>
          {analysis.suggestions && analysis.suggestions.length > 0 && (
             <div className="results-section">
              <h3>Suggestions</h3>
              <ul>{analysis.suggestions.map((suggestion, index) => <li key={index}>{suggestion}</li>)}</ul>
            </div>
          )}
          <button onClick={() => setUiState('idle')}>Analyze Again</button>
        </div>
      )}
    </div>
  );
}

export default App;