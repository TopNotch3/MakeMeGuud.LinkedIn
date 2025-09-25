
# MakeMeGuud.LinkedIn - AI Profile Coach

*A personal AI agent that analyzes your LinkedIn profile and provides actionable feedback to enhance your professional presence. This project was developed as a final project for an internship with OpenX and BlockSeBlock.*

## 💡 The Idea

In today's competitive professional landscape, a strong LinkedIn profile is crucial. However, many individuals, especially students and early-career professionals, struggle to effectively showcase their skills and achievements. They may have impressive projects and experiences but fail to present them in a compelling way.

**MakeMeGuud.LinkedIn** solves this by acting as a personalized AI coach. By providing a LinkedIn profile, the agent performs a comprehensive analysis of the user's activity, bio, and experience. It then delivers two types of feedback:

1.  **Immediate Steps:** Tactical, actionable changes the user can make right now to better reflect their existing achievements.
2.  **Suggestions:** A strategic, long-term roadmap for profile growth, content strategy, and networking.

The agent is designed to be adaptive, providing a guided questionnaire for users with sparse profiles to help them build a strong foundation from scratch.

-----

## 🛠️ Technology Stack

This project is a full-stack application composed of a Python backend, a Next.js web application for onboarding, and a React-based Chrome Extension.

### **Backend**

  * **Language:** **Python 3.11+**
  * **Framework:** **FastAPI** for creating a high-performance, asynchronous API.
  * **AI Integration:** **Google Gemini API** for generative AI capabilities.
  * **Data Validation:** **Pydantic** for robust data validation and settings management.
  * **Server:** **Uvicorn** as the ASGI server.

### **Extension (Side Panel UI)**

  * **Framework:** **React** with **TypeScript** for a modern, type-safe user interface.
  * **Build Tool:** **Vite** for a fast and efficient development and build process.
  * **Browser APIs:** **Chrome Extension APIs (Manifest V3)**, including `sidePanel`, `scripting`, and `storage`.

### **Web App (Onboarding - now deprecated)**

  * **Framework:** **Next.js** (App Router) with **TypeScript**.
  * **Authentication:** **Supabase Auth** for secure user management.
  * **Styling:** **Tailwind CSS** for utility-first styling.

-----

## 🚀 How It Works: The Pipeline

1.  **User Interaction:** The user navigates to a LinkedIn profile and opens the extension's side panel.
2.  **Scraping:** The extension's content script (`content.js`) is programmatically injected into the page. It intelligently waits for dynamic content to load, scrolls to reveal all posts, and scrapes key information like the headline, bio, and post text.
3.  **Data Transmission:** The scraped data is sent to the backend API endpoint (`/analyze`).
4.  **Backend Logic:**
      * The FastAPI server receives the data.
      * It first runs a **completeness check**. If the profile data is too sparse (e.g., no posts), it immediately returns a `questionnaire_needed` response.
      * If the profile is complete, the backend constructs a detailed, engineered prompt containing the user's data and specific instructions.
5.  **AI Analysis:** The prompt is sent to the **Google Gemini API**. The LLM analyzes the data, identifies gaps, and generates "Immediate Steps" and "Suggestions" in a structured format.
6.  **Response & Display:** The backend parses the AI's response and sends the structured JSON back to the extension. The React UI then dynamically renders this information in the side panel for the user.

-----

## 📋 How to Run This Project Locally

To set up and run this project on your local machine, you will need to start three separate services.

**Prerequisites:**

  * Node.js (v18+)
  * Python (v3.11+)
  * A Google Gemini API Key

### **1. Backend Setup**

```bash
# Navigate to the backend directory
cd backend

# Create and activate a Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install all required packages
pip install -r requirements.txt

# Create a .env file and add your API key
# GOOGLE_API_KEY="YOUR_GEMINI_API_KEY"

# Start the server
uvicorn main:app --reload
```

The backend will be running at `http://127.0.0.1:8000`.

### **2. Extension Setup**

```bash
# Navigate to the extension directory in a new terminal
cd extension

# Install all dependencies
npm install

# Create a production build of the extension
npm run build
```

### **3. Loading the Extension in Chrome**

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **"Developer mode"** in the top-right corner.
3.  Click **"Load unpacked"**.
4.  Select the `extension/dist` folder.
5.  Pin the "LinkedIn AI Profile Coach" extension to your toolbar.

You are now ready to use the extension\! Navigate to any LinkedIn profile to begin.

-----

## 🔮 Future Enhancements

This MVP provides a solid foundation. Future enhancements could include:

  * **Re-integrating User Accounts:** Storing analysis history for registered users.
  * **Custom Prompts:** Allowing users to specify their career goals or target industry to receive more tailored advice.
  * **Deeper Analysis:** Scraping and analyzing comments, skills, and endorsements for a more holistic profile view.
  * **UI/UX Polish:** Adding more advanced data visualizations and a more polished design system.
  * **Firefox Support:** Porting the extension to be compatible with Mozilla Firefox.