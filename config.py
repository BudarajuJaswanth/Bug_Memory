import os
import logging
from dotenv import load_dotenv
from pydantic import BaseModel, Field

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger("bug_memory")

class Settings(BaseModel):
    COGNEE_SERVICE_URL: str = Field(default="")
    COGNEE_API_KEY: str = Field(default="")
    LLM_PROVIDER: str = Field(default="gemini")
    LLM_MODEL: str = Field(default="gemini/gemini-2.5-flash")
    LLM_API_KEY: str = Field(default="")
    EMBEDDING_PROVIDER: str = Field(default="gemini")
    EMBEDDING_MODEL: str = Field(default="gemini/gemini-embedding-001")
    EMBEDDING_DIMENSIONS: int = Field(default=3072)
    EMBEDDING_API_KEY: str = Field(default="")
    COGNEE_SKIP_CONNECTION_TEST: str = Field(default="true")
    DATABASE_URL: str = Field(default="sqlite:///./bug_memory.db")
    DEBUG: bool = Field(default=False)

# Initialize and validate configuration
try:
    # Read LLM_API_KEY first to support easy embedding key fallback
    llm_api_key = os.getenv("LLM_API_KEY", "")
    
    settings = Settings(
        COGNEE_SERVICE_URL=os.getenv("COGNEE_SERVICE_URL", ""),
        COGNEE_API_KEY=os.getenv("COGNEE_API_KEY", ""),
        LLM_PROVIDER=os.getenv("LLM_PROVIDER", "gemini"),
        LLM_MODEL=os.getenv("LLM_MODEL", "gemini/gemini-2.5-flash"),
        LLM_API_KEY=llm_api_key,
        EMBEDDING_PROVIDER=os.getenv("EMBEDDING_PROVIDER", "gemini"),
        EMBEDDING_MODEL=os.getenv("EMBEDDING_MODEL", "gemini/gemini-embedding-001"),
        EMBEDDING_DIMENSIONS=int(os.getenv("EMBEDDING_DIMENSIONS", "3072")),
        EMBEDDING_API_KEY=os.getenv("EMBEDDING_API_KEY", llm_api_key),
        COGNEE_SKIP_CONNECTION_TEST=os.getenv("COGNEE_SKIP_CONNECTION_TEST", "true"),
        DATABASE_URL=os.getenv("DATABASE_URL", "sqlite:///./bug_memory.db"),
        DEBUG=os.getenv("DEBUG", "false").lower() in ("true", "1"),
    )
except Exception as e:
    logger.critical("Failed to load settings: %s", e)
    raise e
