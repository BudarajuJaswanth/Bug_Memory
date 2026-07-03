from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import get_db
from models.schemas import (
    BugCreate, BugCreateResponse, RecallRequest, RecallResponse, RecallResultItem,
    ConfirmFixRequest, SimpleStatusResponse
)
from services.bug_service import bug_service
from services.cognee_service import cognee_service
from services.openai_service import openai_service
import logging

logger = logging.getLogger("bug_memory")
router = APIRouter(prefix="/api/bugs", tags=["bugs"])

@router.post("", response_model=BugCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_bug(bug_data: BugCreate, db: Session = Depends(get_db)):
    # 1. Insert into SQLite DB
    db_bug = None
    try:
        db_bug = bug_service.create_bug(db, bug_data)
    except Exception as e:
        logger.exception("Failed to insert bug into database")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SQLite database write failed: {str(e)}"
        )

    # 2. Add to Cognee memory
    try:
        await cognee_service.remember_bug(
            project=bug_data.project,
            error=bug_data.error,
            root_cause=bug_data.root_cause,
            fix=bug_data.fix,
            file=bug_data.file,
            tags=bug_data.tags
        )
        return {"id": db_bug.id, "status": "success"}
    except Exception as e:
        logger.exception("Cognee remember failed. Rolling back SQLite transaction.")
        try:
            db.delete(db_bug)
            db.commit()
        except Exception as db_err:
            logger.error("Failed to roll back SQLite transaction: %s", db_err)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Cognee remember integration error: {str(e)}"
        )

@router.post("/recall", response_model=RecallResponse)
async def recall_bug(req: RecallRequest):
    # 1. Try Cognee Recall first
    try:
        results = await cognee_service.recall_bug(
            project=req.project,
            error_text=req.error_text,
            session_id=req.session_id
        )
    except Exception as e:
        logger.exception("Cognee recall failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Cognee recall integration error: {str(e)}"
        )

    # 2. Check if we have a memory hit
    if results and len(results) > 0:
        return RecallResponse(
            session_id=req.session_id,
            source="memory",
            results=[
                RecallResultItem(
                    text=item["text"],
                    root_cause=item["root_cause"],
                    fix=item["fix"]
                ) for item in results
            ]
        )

    # 3. Memory miss: call OpenAI fallback
    try:
        ai_suggestion = await openai_service.get_fallback_suggestion(req.error_text)
        
        text_summary = f"AI Suggested Fix:\n{ai_suggestion['fix']}"
        
        return RecallResponse(
            session_id=req.session_id,
            source="ai_suggested",
            results=[
                RecallResultItem(
                    text=text_summary,
                    root_cause=ai_suggestion["root_cause"],
                    fix=ai_suggestion["fix"]
                )
            ]
        )
    except Exception as e:
        logger.error("OpenAI fallback failed: %s", e)
        # Return source: "error" with human-readable message if the OpenAI fallback itself fails
        return RecallResponse(
            session_id=req.session_id,
            source="error",
            results=[
                RecallResultItem(
                    text=f"Failed to retrieve suggestions from memory and OpenAI fallback. Error: {str(e)}",
                    root_cause=None,
                    fix=None
                )
            ]
        )

@router.post("/confirm-fix", response_model=SimpleStatusResponse)
async def confirm_fix(req: ConfirmFixRequest, db: Session = Depends(get_db)):
    if req.source == "memory":
        try:
            # Feedback logic for reinforcement: helpful=True, score=5, plus memify
            await cognee_service.add_feedback(
                session_id=req.session_id,
                helpful=True,
                note="Fix confirmed by user"
            )
            await cognee_service.memify()
            return {"status": "success"}
        except Exception as e:
            logger.exception("Failed to confirm fix in Cognee memory")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Cognee memory reinforcement error: {str(e)}"
            )

    elif req.source == "ai_suggested":
        # 1. Insert into SQLite as a new bug record
        db_bug = None
        try:
            bug_data = BugCreate(
                project=req.project,
                error=req.error,
                root_cause=req.root_cause,
                fix=req.fix,
                file=req.file,
                tags=req.tags
            )
            db_bug = bug_service.create_bug(db, bug_data)
        except Exception as e:
            logger.exception("Failed to insert confirmed bug into SQLite")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"SQLite database write failed: {str(e)}"
            )

        # 2. Store as a new permanent memory via remember()
        try:
            await cognee_service.remember_bug(
                project=req.project,
                error=req.error,
                root_cause=req.root_cause,
                fix=req.fix,
                file=req.file,
                tags=req.tags
            )
            return {"status": "success"}
        except Exception as e:
            logger.exception("Failed to store confirmed bug in Cognee. Rolling back SQLite write.")
            try:
                db.delete(db_bug)
                db.commit()
            except Exception as db_err:
                logger.error("Failed to delete SQLite record on rollback: %s", db_err)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Cognee remember integration error: {str(e)}"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid source: '{req.source}'. Must be 'memory' or 'ai_suggested'."
        )
