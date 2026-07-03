from fastapi import APIRouter, HTTPException, status
from models.schemas import FeedbackRequest, SimpleStatusResponse
from services.cognee_service import cognee_service
import logging

logger = logging.getLogger("bug_memory")
router = APIRouter(prefix="/api/feedback", tags=["feedback"])

@router.post("", response_model=SimpleStatusResponse)
async def post_feedback(feedback_data: FeedbackRequest):
    try:
        await cognee_service.add_feedback(
            session_id=feedback_data.session_id,
            helpful=feedback_data.helpful,
            note=feedback_data.note
        )
        await cognee_service.memify()
        return {"status": "success"}
    except Exception as e:
        logger.exception("Feedback or memify call failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Cognee feedback/memify error: {str(e)}"
        )
