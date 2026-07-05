# Force reload
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from db.database import engine, Base
from routers.projects import router as projects_router
from routers.bugs import router as bugs_router
from routers.feedback import router as feedback_router
from services.cognee_service import cognee_service

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bug_memory")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure SQLite tables exist
    logger.info("Creating SQLite tables if they do not exist")
    Base.metadata.create_all(bind=engine)
    
    # Initialize Cognee Cloud serving connection
    try:
        await cognee_service.serve()
        logger.info("Successfully connected to Cognee Cloud")
    except Exception as e:
        logger.critical("Failed to connect to Cognee Cloud on startup: %s", e)
        raise e
        
    yield
    
    # Disconnect from Cognee Cloud on shutdown
    try:
        await cognee_service.disconnect()
        logger.info("Successfully disconnected from Cognee Cloud")
    except Exception as e:
        logger.error("Failed to disconnect from Cognee: %s", e)

app = FastAPI(
    title="Bug Memory Backend",
    description="Backend API for the Bug Memory debugging assistant using Cognee and SQLite",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration — reads FRONTEND_URL env var for production (e.g. Vercel URL)
_frontend_url = os.getenv("FRONTEND_URL", "").rstrip("/")
_allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
_allowed_origin_regex = r"https://.*\.vercel\.app"

if _frontend_url:
    _allowed_origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=_allowed_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(projects_router)
app.include_router(bugs_router)
app.include_router(feedback_router)

@app.get("/")
def read_root():
    return {"message": "Bug Memory API is running"}
