import time
import logging
from app.core.config import DISTRICT_ID_TO_NAME
from app.utils.data_loader import find_district_by_name, load_lines, load_schools_in_district
from app.utils.geo_utils import generate_candidates, get_slope_at_point
from app.core.config import DEM_PATH
import rasterio

logging.basicConfig(level=logging.INFO)

def profile():
    district_name = DISTRICT_ID_TO_NAME.get(1) # Chitipa or similar
    if not district_name:
        district_name = list(DISTRICT_ID_TO_NAME.values())[0]

    idx, district_info = find_district_by_name(district_name)
    if district_info is None:
        print("District not found")
        return

    district_poly = district_info["polygon"]

    t0 = time.time()
    roads = load_lines(None, "roads")
    t1 = time.time()
    print(f"Loading roads: {t1 - t0:.2f}s")

    t0 = time.time()
    water = load_lines(None, "water")
    t1 = time.time()
    print(f"Loading water: {t1 - t0:.2f}s")

    candidates = generate_candidates(district_poly, n=400)
    print(f"Generated {len(candidates)} candidates.")

    # Time distance computation
    t0 = time.time()
    road_dists = []
    if roads:
        for pt in candidates:
            road_dists.append(pt.distance(roads))
    t1 = time.time()
    print(f"Road distance calculation (400 pts): {t1 - t0:.2f}s")

    # Time slope computation
    t0 = time.time()
    slopes = []
    try:
        dem_src = rasterio.open(DEM_PATH)
        for pt in candidates:
            slopes.append(get_slope_at_point(pt.x, pt.y, dem_src=dem_src))
    except Exception as e:
        print("Slope calc failed:", e)
    t1 = time.time()
    print(f"Slope calculation (400 pts): {t1 - t0:.2f}s")

if __name__ == "__main__":
    profile()
