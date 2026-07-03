# Bug Memory — Collaborative Debugging Index

Bug Memory is a collaborative debugging knowledge platform designed to help developers index, search, and automatically recall verified resolutions for runtime exceptions and stack traces. It leverages the **Cognee Semantic Memory Graph** and **Gemini/OpenAI** fallback synthesis to eliminate duplicate troubleshooting in development environments.

---

## 🏗️ System Architecture

The application is structured into two main components:

1. **Backend API (`main.py` / `/routers` / `/services`):**
   * Powered by **FastAPI** and **SQLite** (local database).
   * Orchestrates semantic memory indexing, keyword tokenization, and vector retrieval using **Cognee SDK**.
   * Employs fallback suggestions synthesized via **Gemini 2.5 Flash / OpenAI** when a direct memory match is missed.
   
2. **Frontend client (`/frontend`):**
   * A premium React application built with **TypeScript**, **Vite**, **Framer Motion**, and **Tailwind CSS**.
   * Integrates a visual network topology memory graph, command palette search engine, and input-validated traceback logging forms.

---

## ⚙️ Backend Setup & Configuration

### Prerequisites
* Python 3.10+
* Node.js 18+ (for frontend)

### 1. Environment Configuration
Create or inspect the `.env` file in the root directory. It contains settings for Cognee Cloud, Gemini API, and SQLite database:

```env
# Cognee Cloud Connection Settings
COGNEE_SERVICE_URL="https://tenant-xxxx.aws.cognee.ai"
COGNEE_API_KEY="your-cognee-api-key"

# LLM & Embedding Integrations (Gemini API)
LLM_PROVIDER="gemini"
LLM_MODEL="gemini/gemini-2.5-flash"
LLM_API_KEY="your-gemini-api-key"

EMBEDDING_PROVIDER="gemini"
EMBEDDING_MODEL="gemini/gemini-embedding-001"
EMBEDDING_DIMENSIONS="3072"
EMBEDDING_API_KEY="your-gemini-api-key"

# Dev Settings
DEBUG=false
DATABASE_URL="sqlite:///./bug_memory.db"
COGNEE_SKIP_CONNECTION_TEST="true"
```

### 2. Dependency Installation
Create a virtual environment and install the required Python packages:

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate

# Install requirements
pip install -r requirements.txt
```

### 3. Start the Backend Server
Run the FastAPI application locally using Uvicorn:

```bash
python -m uvicorn main:app --port 8000
```
The server will boot up and bind to `http://127.0.0.1:8000`.

### 4. Running Backend API Tests
To validate the endpoint contracts and verify that the Cognee remote database connection is functioning correctly, execute:

```bash
python tests/test_api.py
```

---

## 🏗️ Frontend Client Setup

To configure, install, and run the React frontend client, please refer to the dedicated instructions in [frontend/README.md](file:///c:/Users/chand/OneDrive/Desktop/BUG%20MEMORY/frontend/README.md).
