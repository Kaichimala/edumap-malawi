import os
import logging
import rasterio
from fastapi import HTTPException
from shapely.ops import unary_union
from app.core.config import DEM_PATH, TO_WGS, DISTRICT_ID_TO_NAME
from app.utils.data_loader import (
    find_district_by_name, load_lines, load_schools_in_district
)
from app.utils.geo_utils import reclassify, generate_candidates, get_slopes_for_points
from app.services.buffer_service import create_buffer_features

logger = logging.getLogger("edumap")


async def run_suitability_analysis(criteria):
    district_name = DISTRICT_ID_TO_NAME.get(criteria.district_id)

    idx, district_info = find_district_by_name(district_name)
    if district_info is None:
        raise HTTPException(
            status_code=404,
            detail=f"District '{district_name}' not found in database"
        )
    district_poly = district_info["polygon"]

    # Load all spatial layers from Supabase (path arg ignored — loader uses DB)
    roads  = load_lines(None, "roads")
    water  = load_lines(None, "water")
    district_schools = load_schools_in_district(district_poly, district_name)
    candidates = generate_candidates(district_poly, n=400)

    if not candidates:
        raise HTTPException(
            status_code=404,
            detail=f"No candidate points inside '{district_name}' — district may be too small"
        )

    road_dists, water_dists, school_dists = [], [], []
    for pt in candidates:
        road_dists.append(roads.distance(pt)  if roads else 5000.0)
        water_dists.append(water.distance(pt) if water else 5000.0)
        # Distance to nearest existing school — proxy for population need
        if district_schools:
            school_dists.append(min(pt.distance(s["pt_utm"]) for s in district_schools))
        else:
            school_dists.append(0.0)
            
    # Batched slope calculation (fast)
    slopes = get_slopes_for_points(candidates)

    rd_min,  rd_max  = min(road_dists),   max(road_dists)
    wd_min,  wd_max  = min(water_dists),  max(water_dists)
    sl_min,  sl_max  = min(slopes),       max(slopes)
    sch_min, sch_max = min(school_dists), max(school_dists)

    total_weight = (
        criteria.road_weight + criteria.river_weight +
        criteria.population_weight + criteria.slope_weight
    ) or 1.0

    features = []
    for i, pt in enumerate(candidates):
        road_score  = reclassify(road_dists[i],  rd_min,  rd_max,  invert=True)
        slope_score = reclassify(slopes[i],      sl_min,  sl_max,  invert=True)

        wd_norm     = (water_dists[i] - wd_min) / max(wd_max - wd_min, 1)
        water_score = max(1.0, min(10.0, 10.0 - abs(wd_norm - 0.15) * 10.0))

        # Population need score: points far from existing schools are underserved → higher score
        if district_schools and sch_max > sch_min:
            pop_score = reclassify(school_dists[i], sch_min, sch_max, invert=False)
        else:
            pop_score = 5.0  # neutral when no existing schools recorded

        raw = (
            criteria.road_weight       * road_score  +
            criteria.river_weight      * water_score +
            criteria.population_weight * pop_score   +
            criteria.slope_weight      * slope_score
        )
        final_score = max(0, min(100, int(round((raw / (total_weight * 10)) * 100))))
        lng, lat = TO_WGS(pt.x, pt.y)

        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lng, lat]},
            "properties": {
                "suitability_score": final_score,
                "road_score":        round(road_score, 1),
                "water_score":       round(water_score, 1),
                "slope_score":       round(slope_score, 1),
                "pop_score":         round(pop_score, 1),
                "dist_road_m":       int(road_dists[i]),
                "dist_water_m":      int(water_dists[i]),
                "slope_deg":         round(slopes[i], 2),
                "dist_nearest_school_m": int(school_dists[i]),
                "district":          district_name,
                "name":              f"Site {i + 1}",
                "feature_type":      "point",
            }
        })

    features.sort(key=lambda f: f["properties"]["suitability_score"], reverse=True)
    top_features = features[:30]

    buffer_features, buffer_geoms_utm = create_buffer_features(
        top_features, district_schools, roads, water, criteria.level, district_name
    )

    merged       = unary_union(buffer_geoms_utm) if buffer_geoms_utm else None
    unique_area  = merged.area if merged else 0
    district_area = district_poly.area
    coverage_pct = round((unique_area / district_area) * 100, 2) if district_area > 0 else 0
    underserved  = sum(1 for bf in buffer_features if bf["properties"]["is_underserved"])
    overlapping  = sum(1 for bf in buffer_features if len(bf["properties"]["overlaps"]) > 0)

    return {
        "type": "FeatureCollection",
        "features": top_features + buffer_features,
        "metadata": {
            "district":                     district_name,
            "district_id":                  criteria.district_id,
            "level":                        criteria.level,
            "total_candidates_evaluated":   len(candidates),
            "top_sites_returned":           len(top_features),
            "buffer_zones_generated":       len(buffer_features),
            "existing_schools_in_district": len(district_schools),
            "underserved_zones":            underserved,
            "overlapping_zones":            overlapping,
            "district_area_km2":            round(district_area / 1e6, 1),
            "buffer_coverage_km2":          round(unique_area / 1e6, 2),
            "buffer_coverage_pct":          coverage_pct,
        }
    }