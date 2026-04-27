from fastapi import APIRouter, HTTPException
from app.models.schemas import SuitabilityCriteria
from app.core.config import DISTRICT_ID_TO_NAME
from app.services.analysis_service import run_suitability_analysis

router = APIRouter()

@router.post("/analyze-suitability")
async def analyze_suitability(criteria: SuitabilityCriteria):
    if not DISTRICT_ID_TO_NAME.get(criteria.district_id):
        raise HTTPException(status_code=400, detail=f"Unknown district_id: {criteria.district_id}")
    try:
        return await run_suitability_analysis(criteria)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")