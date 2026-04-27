from fastapi import APIRouter, HTTPException
from app.core.config import DISTRICT_ID_TO_NAME
from app.utils.data_loader import find_district_by_name, load_schools_in_district

router = APIRouter()

@router.get("/schools/{district_id}")
async def get_schools(district_id: int):
    district_name = DISTRICT_ID_TO_NAME.get(district_id)
    if not district_name:
        return []
    try:
        idx, district_info = find_district_by_name(district_name)
        if district_info is None:
            return []
        schools = load_schools_in_district(district_info["polygon"], district_name)
        for s in schools:
            s["district_id"] = district_id
            s.pop("pt_utm", None)
        return schools
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))