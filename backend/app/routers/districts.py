from fastapi import APIRouter
from app.core.config import DISTRICT_ID_TO_NAME
from app.utils.data_loader import find_district_by_name

router = APIRouter()


@router.get("/districts")
def get_districts():
    """Return all districts with real centroid lat/lng from the shapefile."""
    result = []
    for district_id, name in DISTRICT_ID_TO_NAME.items():
        _, info = find_district_by_name(name)
        if info:
            result.append({
                "id":     district_id,
                "name":   info["name"],
                "region": info.get("region", ""),
                "lat":    info.get("lat", -13.5),
                "lng":    info.get("lng", 34.3),
            })
        else:
            result.append({"id": district_id, "name": name, "region": "", "lat": -13.5, "lng": 34.3})
    return result