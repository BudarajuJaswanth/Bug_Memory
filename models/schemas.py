from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class ProjectCreate(BaseModel):
    name: str

class ProjectResponse(BaseModel):
    name: str
    created_at: datetime

    class Config:
        from_attributes = True

class ProjectListItem(BaseModel):
    name: str
    bug_count: int

class ProjectListResponse(BaseModel):
    projects: List[ProjectListItem]

class SimpleStatusResponse(BaseModel):
    status: str

class BugCreate(BaseModel):
    project: str
    error: str
    root_cause: str
    fix: str
    file: str
    tags: List[str]

class BugCreateResponse(BaseModel):
    id: int
    status: str

class GraphNode(BaseModel):
    id: str
    label: str
    tags: List[str]

class GraphLink(BaseModel):
    source: str
    target: str

class ProjectGraphResponse(BaseModel):
    nodes: List[GraphNode]
    links: List[GraphLink]

class RecallRequest(BaseModel):
    project: str
    error_text: str
    session_id: str

class RecallResultItem(BaseModel):
    text: str
    root_cause: Optional[str] = None
    fix: Optional[str] = None

class RecallResponse(BaseModel):
    session_id: str
    source: str  # "memory" | "ai_suggested" | "error"
    results: List[RecallResultItem]

class FeedbackRequest(BaseModel):
    session_id: str
    helpful: bool
    note: str

class ConfirmFixRequest(BaseModel):
    session_id: str
    source: str  # "memory" | "ai_suggested"
    project: str
    error: str
    root_cause: str
    fix: str
    file: str
    tags: List[str]
