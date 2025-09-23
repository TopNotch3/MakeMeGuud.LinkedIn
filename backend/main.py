from fastapi import FastAPI

app = FastAPI(
    title="MakeMeGuud.LinkedIn",
    description="An AI agent in the form of a browser extension which analyzes your LinkedIn profile and suggests necessary changes which you should make to grow on LinkedIn.",
    version="0.1.0",
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the LinkedIn AI Coach API!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}