from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import Project
from models.schemas import ProjectCreate, ProjectResponse, ProjectListResponse, SimpleStatusResponse, ProjectGraphResponse
from services.bug_service import bug_service
from services.cognee_service import cognee_service
import logging

logger = logging.getLogger("bug_memory")
router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(project_data: ProjectCreate, db: Session = Depends(get_db)):
    try:
        project = bug_service.create_project_if_not_exists(db, project_data.name)
        return project
    except Exception as e:
        logger.exception("Failed to create project")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal database error: {str(e)}"
        )

@router.get("", response_model=ProjectListResponse)
def get_projects(db: Session = Depends(get_db)):
    try:
        projects = bug_service.get_projects(db)
        return {"projects": projects}
    except Exception as e:
        logger.exception("Failed to fetch projects")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal database error: {str(e)}"
        )

@router.delete("/{name}", response_model=SimpleStatusResponse)
async def delete_project(name: str, db: Session = Depends(get_db)):
    # 1. Forget memory in Cognee Cloud
    try:
        await cognee_service.forget_project(name)
    except Exception as e:
        logger.exception("Failed to forget project memory in Cognee")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Cognee integration error: {str(e)}"
        )
    
    # 2. Delete from SQLite database
    try:
        success = bug_service.delete_project(db, name)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project '{name}' not found"
            )
        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to delete project from local DB")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal database error: {str(e)}"
        )

@router.get("/{name}/graph", response_model=ProjectGraphResponse)
def get_project_graph(name: str, db: Session = Depends(get_db)):
    try:
        # Check if project exists
        project = db.query(Project).filter(Project.name == name).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project '{name}' not found"
            )
        return bug_service.build_project_graph(db, name)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to build project graph")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to build graph: {str(e)}"
        )

from db.models import Bug
import json

@router.get("/{name}/bugs")
def get_project_bugs(name: str, db: Session = Depends(get_db)):
    try:
        project = db.query(Project).filter(Project.name == name).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project '{name}' not found"
            )
        bugs = db.query(Bug).filter(Bug.project == name).order_by(Bug.created_at.desc()).all()
        
        result = []
        for bug in bugs:
            try:
                bug_tags = json.loads(bug.tags)
            except Exception:
                bug_tags = [t.strip() for t in bug.tags.split(",") if t.strip()]
            result.append({
                "id": bug.id,
                "project": bug.project,
                "error": bug.error,
                "root_cause": bug.root_cause,
                "fix": bug.fix,
                "file": bug.file,
                "tags": bug_tags,
                "created_at": bug.created_at.isoformat() if bug.created_at else None
            })
        return {"bugs": result}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to fetch project bugs")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal database error: {str(e)}"
        )
