from shapely.geometry import Point
from app.core.config import TO_UTM, TO_WGS, BUFFER_RADII

def create_buffer_features(top_features, district_schools, roads, water, level, district_name):
    level = level if level in BUFFER_RADII else "primary"
    radii_table = BUFFER_RADII[level]

    buffer_features  = []
    buffer_geoms_utm = []

    for rank, feat in enumerate(top_features):
        score       = feat["properties"]["suitability_score"]
        lng_pt, lat_pt = feat["geometry"]["coordinates"]

        radius_m = (radii_table["high"] if score >= 75
                    else radii_table["medium"] if score >= 50
                    else radii_table["low"])

        x_utm, y_utm  = TO_UTM(lng_pt, lat_pt)
        site_pt_utm   = Point(x_utm, y_utm)
        circle_utm    = site_pt_utm.buffer(radius_m, resolution=24)

        schools_inside       = []
        nearest_school_name  = None
        nearest_school_dist  = None

        for s in district_schools:
            dist_m = site_pt_utm.distance(s["pt_utm"])
            if circle_utm.contains(s["pt_utm"]):
                schools_inside.append(s["name"])
            if nearest_school_dist is None or dist_m < nearest_school_dist:
                nearest_school_dist = dist_m
                nearest_school_name = s["name"]

        road_within  = roads.intersects(circle_utm) if roads else False
        water_within = water.intersects(circle_utm) if water else False

        overlap_ranks = []
        for prev_rank, prev_geom in enumerate(buffer_geoms_utm):
            if circle_utm.intersects(prev_geom):
                inter       = circle_utm.intersection(prev_geom)
                overlap_pct = (inter.area / circle_utm.area) * 100
                if overlap_pct > 5:
                    overlap_ranks.append({
                        "with_rank":   prev_rank + 1,
                        "overlap_pct": round(overlap_pct, 1),
                    })

        buffer_geoms_utm.append(circle_utm)
        ring_wgs = [list(TO_WGS(x, y)) for x, y in circle_utm.exterior.coords]

        buffer_features.append({
            "type": "Feature",
            "geometry": {"type": "Polygon", "coordinates": [ring_wgs]},
            "properties": {
                "suitability_score":      score,
                "district":               district_name,
                "name":                   feat["properties"]["name"],
                "rank":                   rank + 1,
                "radius_m":               radius_m,
                "level":                  level,
                "feature_type":           "buffer",
                "schools_in_buffer":      len(schools_inside),
                "school_names_in_buffer": schools_inside[:5],
                "nearest_school_name":    nearest_school_name,
                "nearest_school_dist_m":  int(nearest_school_dist) if nearest_school_dist else None,
                "road_accessible":        road_within,
                "water_accessible":       water_within,
                "overlaps":               overlap_ranks,
                "is_underserved":         len(schools_inside) == 0,
            }
        })

    return buffer_features, buffer_geoms_utm