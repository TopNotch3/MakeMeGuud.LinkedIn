import os
import google.generativeai as genai
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from the .env file
load_dotenv()

# 1. CONFIGURE THE GEMINI CLIENT
# Configure the Gemini API with your key
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Create an instance of the Generative Model.
# 'gemini-1.5-pro-latest' is the most capable model.
# If you face issues, a reliable alternative is 'gemini-pro'.
model = genai.GenerativeModel('gemini-1.5-pro-latest')


# Pydantic models for data structure
class ProfileInput(BaseModel):
    headline: str | None = None
    bio: str | None = Field(None, description="The user's 'About' section.")
    posts_text: str | None = Field(None, description="Concatenated text from the user's recent posts.")

class AnalysisOutput(BaseModel):
    immediate_steps: List[str]
    suggestions: List[str]


# FastAPI app instance
app = FastAPI(
    title="LinkedIn AI Profile Coach API",
    description="An API to analyze LinkedIn profiles and provide feedback.",
    version="0.1.0",
)

# <<< --- START OF NEW CORS CONFIGURATION --- >>>
# This is the middleware that will handle CORS.
# It allows requests from any origin, which is fine for development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods
    allow_headers=["*"], # Allows all headers
)
# <<< ---  END OF NEW CORS CONFIGURATION  --- >>>

@app.get("/")
def read_root():
    """A welcome message for the API root."""
    return {"message": "Welcome to the LinkedIn AI Coach API!"}


@app.get("/health")
def health_check():
    """Returns a status 'ok' to indicate the server is healthy."""
    return {"status": "ok"}


# The /analyze endpoint using Gemini
@app.post("/analyze", response_model=AnalysisOutput)
async def analyze_profile(profile: ProfileInput):
    """
    Receives LinkedIn profile data, analyzes it using the Gemini model,
    and returns actionable feedback.
    """
    # 2. CONSTRUCT THE DETAILED PROMPT FOR GEMINI
    prompt = f"""
    You are an expert LinkedIn Profile Coach. Your task is to analyze a user's profile data and provide actionable feedback.

    Here is the user's data:
    - Headline: "{profile.headline}"
    - Bio (About Section): "{profile.bio}"
    - Recent Posts: "{profile.posts_text}"

    Please perform the following analysis and structure your response with the exact headings specified below:

    ### Immediate Steps
    Analyze the "Recent Posts" to identify specific achievements, projects, or skills that are NOT mentioned or highlighted in the "Bio" or "Headline". Generate a bulleted list of 3-5 high-impact, actionable steps the user should take right now to improve their profile based on this gap. For example, suggest specific ways to rephrase their headline or add a sentence to their bio that includes a missing achievement.

    ### Suggestions
    Based on the user's entire profile, provide a bulleted list of 3 strategic, long-term suggestions for how they can continue to build their presence and authority on LinkedIn. These should be forward-looking, like content ideas, networking strategies, or skills to develop next.
    """

    # 3. CALL THE GEMINI MODEL AND PARSE THE RESPONSE
    response = await model.generate_content_async(prompt)
    full_text = response.text

    try:
        # Split the response into two parts based on our ### headings
        steps_part, suggestions_part = full_text.split("### Suggestions")

        # Clean up and format the "Immediate Steps"
        immediate_steps = [line.strip().lstrip('-* ').capitalize() for line in steps_part.replace("### Immediate Steps", "").strip().split('\n') if line.strip()]

        # Clean up and format the "Suggestions"
        suggestions = [line.strip().lstrip('-* ').capitalize() for line in suggestions_part.strip().split('\n') if line.strip()]

    except ValueError:
        # Fallback if the AI doesn't follow the format perfectly
        immediate_steps = ["Could not parse the AI's response for immediate steps."]
        suggestions = ["Could not parse the AI's response for suggestions."]

    return AnalysisOutput(immediate_steps=immediate_steps, suggestions=suggestions)