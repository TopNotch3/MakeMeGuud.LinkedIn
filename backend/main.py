import os
import google.generativeai as genai
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Literal, Any
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from fastapi.security import OAuth2PasswordBearer

load_dotenv()

# --- AI and Supabase Client Configuration ---
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-pro-latest')
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

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

# --- FastAPI App Instance ---
app = FastAPI(title="LinkedIn AI Profile Coach API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- Helper Functions ---
async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        user = supabase.auth.get_user(token).user
        if not user: raise HTTPException(status_code=401, detail="Invalid credentials")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid credentials")

def is_profile_complete(profile: ProfileInput) -> bool:
    if not profile.posts_text or len(profile.posts_text) < 50:
        return False
    return True

# --- API Endpoints ---
@app.get("/health")
def health_check():
    return {"status": "reloaded successfully!", "version": 2}

@app.post("/analyze", response_model=ApiResponse)
async def analyze_profile(profile: ProfileInput, current_user: dict = Depends(get_current_user)):
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
    - [Actionable Step 2]
    - [Actionable Step 3]
    ### Suggestions
    - [Long-term Suggestion 1]
    - [Long-term Suggestion 2]
    """
    
    response = await model.generate_content_async(prompt)
    full_text = response.text
    print("--- RAW AI RESPONSE ---\n", full_text, "\n--- END RAW AI RESPONSE ---")

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
async def generate_from_answers(form_data: QuestionnaireInput, current_user: dict = Depends(get_current_user)):
    # ... (This function is unchanged)
    prompt = f"""
    You are a LinkedIn Profile Coach...
    """
    response = await model.generate_content_async(prompt)
    full_text = response.text
    immediate_steps = [line.strip().lstrip('-* ').capitalize() for line in full_text.replace("### Immediate Steps", "").strip().split('\n') if line.strip()]
    return AnalysisOutput(immediate_steps=immediate_steps, suggestions=[])