import os
import google.generativeai as genai
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List, Literal, Any
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from the .env file
load_dotenv()

# --- AI Client Configuration (Supabase is removed) ---
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-pro-latest')

# --- Pydantic Models ---
class ProfileInput(BaseModel):
    headline: str | None = None
    bio: str | None = Field(None, description="The user's 'About' section.")
    posts_text: str | None = Field(None, description="Concatenated text from the user's recent posts.")

class AnalysisOutput(BaseModel):
    immediate_steps: List[str]
    suggestions: List[str]

class QuestionnaireInput(BaseModel):
    careerGoal: str
    projects: str
    skills: str

class ApiResponse(BaseModel):
    type: Literal['analysis', 'questionnaire_needed']
    data: Any

# --- FastAPI App Instance & CORS ---
app = FastAPI(
    title="LinkedIn AI Profile Coach API",
    description="An open API to analyze LinkedIn profiles and provide feedback.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Helper Function ---
def is_profile_complete(profile: ProfileInput) -> bool:
    """A simplified check. A profile is incomplete if it has no recent post activity."""
    if not profile.posts_text or len(profile.posts_text) < 50:
        return False
    return True

# --- API Endpoints (Authentication is removed) ---
@app.get("/health")
def health_check():
    """A simple endpoint to confirm the server is running."""
    return {"status": "ok", "version": "1.0.0"}

@app.post("/analyze", response_model=ApiResponse)
async def analyze_profile(profile: ProfileInput): # No more 'current_user'
    if not is_profile_complete(profile):
        return ApiResponse(type="questionnaire_needed", data={})

    prompt = f"""
    Analyze the following LinkedIn profile data immediately. Provide your output in the exact format specified below. Do not ask for more information. Do not add any conversational text before or after your analysis. Your entire response must start with '### Immediate Steps'.

    **Profile Data:**
    - Headline: "{profile.headline if profile.headline else '[Not Provided]'}"
    - Bio (About Section): "{profile.bio if profile.bio else '[Not Provided]'}"
    - Recent Posts: "{profile.posts_text if profile.posts_text else '[Not Provided]'}"

    **Instructions:**
    If any section like the Bio is '[Not Provided]', your primary 'Immediate Step' must be to advise the user to fill it out. Base the rest of your analysis on the information that is available.

    **Required Output Format:**
    ### Immediate Steps
    - [Actionable Step 1]
    ### Suggestions
    - [Long-term Suggestion 1]
    """
    
    response = await model.generate_content_async(prompt)
    full_text = response.text
    
    try:
        immediate_steps, suggestions = [], []
        steps_start = full_text.find("### Immediate Steps")
        suggestions_start = full_text.find("### Suggestions")

        if steps_start != -1:
            steps_end = suggestions_start if suggestions_start != -1 else len(full_text)
            steps_part = full_text[steps_start:steps_end]
            immediate_steps = [line.strip().lstrip('-* ').capitalize() for line in steps_part.replace("### Immediate Steps", "").strip().split('\n') if line.strip()]
        
        if suggestions_start != -1:
            suggestions_part = full_text[suggestions_start:]
            suggestions = [line.strip().lstrip('-* ').capitalize() for line in suggestions_part.replace("### Suggestions", "").strip().split('\n') if line.strip()]
        
        if not immediate_steps and not suggestions:
            raise ValueError("Parsing resulted in empty lists.")
            
    except Exception as e:
        print(f"Error parsing AI response: {e}")
        immediate_steps = ["The AI provided feedback, but it could not be automatically formatted."]
        suggestions = []

    analysis_data = AnalysisOutput(immediate_steps=immediate_steps, suggestions=suggestions)
    return ApiResponse(type="analysis", data=analysis_data)

@app.post("/generate-from-answers", response_model=AnalysisOutput)
async def generate_from_answers(form_data: QuestionnaireInput): # No more 'current_user'
    prompt = f"""
    You are a LinkedIn Profile Coach. A new user with a sparse profile has provided the following information about themselves:
    - Career Goal / Field of Interest: "{form_data.careerGoal}"
    - A Key Project They've Worked On: "{form_data.projects}"
    - Their Top Skills: "{form_data.skills}"

    Based ONLY on this information, generate a set of foundational "Immediate Steps" for them to build their profile from scratch. This should include a compelling headline suggestion, a short but effective "About" section draft, and suggestions to add their project and skills.

    Structure your response with the heading '### Immediate Steps'. Do not include a '### Suggestions' section.
    """

    response = await model.generate_content_async(prompt)
    full_text = response.text
    
    immediate_steps = [line.strip().lstrip('-* ').capitalize() for line in full_text.replace("### Immediate Steps", "").strip().split('\n') if line.strip()]
    
    return AnalysisOutput(immediate_steps=immediate_steps, suggestions=[])