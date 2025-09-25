import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';

// --- Type Definitions ---
type AnalysisOutput = {
  immediate_steps: string[];
  suggestions: string[];
};

function App() {
  // --- STATE MANAGEMENT (Simplified) ---
  const [uiState, setUiState] = useState('idle'); // idle, analyzing, results, questionnaire
  const [analysis, setAnalysis] = useState<AnalysisOutput | null>(null);

  // State for the questionnaire form
  const [careerGoal, setCareerGoal] = useState('');
  const [projects, setProjects] = useState('');
  const [skills, setSkills] = useState('');

  // --- CORE LOGIC ---
  useEffect(() => {
    // This listener handles messages from our content.js scraper script
    const handleInternalMessage = (message: any) => {
      if (message.action === "scrapedData") {
        handleApiAnalysis(message.data);
      } else if (message.action === "scrapeFailed") {
        console.error("Scraping failed:", message.error);
        alert(`Could not scrape the page. Error: ${message.error}`);
        setUiState('idle');
      }
    };
    chrome.runtime.onMessage.addListener(handleInternalMessage);
    return () => chrome.runtime.onMessage.removeListener(handleInternalMessage);
  }, []); // This effect runs only once

  // --- EVENT HANDLERS (Simplified) ---
  const handleAnalyzeClick = async () => {
    setUiState('analyzing');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    }
  };

  const handleApiAnalysis = async (scrapedData: any) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // The 'Authorization' header is now REMOVED
        },
        body: JSON.stringify(scrapedData),
      });
      if (!response.ok) {
        const err = await response.json(); throw new Error(err.detail || 'Analysis failed.');
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
  };

  const handleQuestionnaireSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setUiState('analyzing');
    const formData = { careerGoal, projects, skills };
    try {
      const response = await fetch("http://127.0.0.1:8000/generate-from-answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
           // The 'Authorization' header is now REMOVED
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const err = await response.json(); throw new Error(err.detail || 'Failed to generate steps.');
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

  // --- UI RENDERING LOGIC ---
  const renderContent = () => {
    switch (uiState) {
      case 'analyzing':
        return (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Analyzing... The page will scroll automatically.</p>
          </div>
        );
      case 'questionnaire':
        return (
          <div className="questionnaire-form">
            <h3>Tell Me More About You</h3>
            <p>Your profile is a bit sparse. Let's fill in the blanks.</p>
            <form onSubmit={handleQuestionnaireSubmit}>
              <label>Career Goal</label>
              <input type="text" value={careerGoal} onChange={(e) => setCareerGoal(e.target.value)} required />
              <label>A Project You're Proud Of</label>
              <textarea value={projects} onChange={(e) => setProjects(e.target.value)} required></textarea>
              <label>Your Top Skills</label>
              <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} required />
              <button type="submit">Generate Steps</button>
            </form>
          </div>
        );
      case 'results':
        return analysis && (
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
        );
      case 'idle':
      default:
        return (
          <>
            <p className="welcome-text">Ready to improve your LinkedIn profile?</p>
            <button onClick={handleAnalyzeClick}>Analyze My Profile</button>
          </>
        );
    }
  };

  return (
    <div className="container">
      <h2>MakeMeGuud.LinkedIn</h2>
      {renderContent()}
    </div>
  );
}

export default App;