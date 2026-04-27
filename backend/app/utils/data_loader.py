import os
import json
import logging
import geopandas as gpd
from shapely.geometry import shape, Point, LineString
from shapely.ops import unary_union
from shapely.strtree import STRtree
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

from app.core.config import TO_UTM, TO_WGS

logger = logging.getLogger("edumap")

load_dotenv()
db_url = os.getenv("DATABASE_URL")
if db_url and (db_url.startswith("postgres://") or db_url.startswith("postgresql://")):
    db_url = db_url.replace("postgres://", "postgresql+psycopg://").replace("postgresql://", "postgresql+psycopg://")

engine = create_engine(db_url, pool_pre_ping=True) if db_url else None

_districts_loaded = None
_roads_utm = None
_water_utm = None

class SpatialLayer:
    def __init__(self, geometries):
        # Only keep valid, non-empty geometries
        self.geometries = [g for g in geometries if g and g.is_valid and not g.is_empty]
        self.tree = STRtree(self.geometries) if self.geometries else None

    def distance(self, pt):
        if not self.tree:
            return 5000.0
        idx = self.tree.nearest(pt)
        if idx is None:
            return 5000.0
        # In Shapely 2.0+, nearest(pt) returns an array or single integer
        # If it's an array, take the first one
        if isinstance(idx, (list, tuple)) or (hasattr(idx, 'shape') and len(idx.shape) > 0):
            idx = idx[0]
        nearest_geom = self.geometries[idx]
        return pt.distance(nearest_geom)

    def intersects(self, geom):
        if not self.tree:
            return False
        indices = self.tree.query(geom, predicate='intersects')
        return len(indices) > 0

    def __bool__(self):
        return bool(self.geometries)


def load_all_districts():
    global _districts_loaded
    if _districts_loaded is not None:
        return _districts_loaded

    logger.info("Fetching districts from Supabase...")
    query = "SELECT id, district as name, region, geometry FROM mwi_districts"
    gdf = gpd.read_postgis(query, con=engine, geom_col='geometry')
    gdf = gdf.to_crs(epsg=32736)
    
    districts = {}
    for i, row in enumerate(gdf.itertuples()):
        poly_utm = row.geometry
        cx, cy = poly_utm.centroid.x, poly_utm.centroid.y
        try:
            lng, lat = TO_WGS(cx, cy)
        except Exception:
            lng, lat = 34.3, -13.5  # fallback
            
        districts[i] = {
            "name": str(row.name).strip().title() if row.name else "Unknown",
            "region": str(row.region).strip().title() if row.region else "Unknown",
            "polygon": poly_utm,
            "lat": round(lat, 4),
            "lng": round(lng, 4),
        }
    _districts_loaded = districts
    return districts


def find_district_by_name(name: str):
    districts = load_all_districts()
    name_lower = name.lower()
    for idx, d in districts.items():
        if d["name"].lower() == name_lower:
            return idx, d
    # Partial match fallback
    for idx, d in districts.items():
        if name_lower in d["name"].lower() or d["name"].lower() in name_lower:
            return idx, d
    return None, None


def load_lines(path, which: str):
    global _roads_utm, _water_utm
    cached = _roads_utm if which == "roads" else _water_utm
    if cached is not None:
        return cached

    logger.info(f"Fetching {which} from Supabase...")
    table = "mwi_roads" if which == "roads" else "mwi_waterways"
    query = f"SELECT geometry FROM {table}"
    
    gdf = gpd.read_postgis(query, con=engine, geom_col='geometry')
    gdf = gdf.to_crs(epsg=32736)
    
    lines = gdf['geometry'].tolist()
    
    # Wrap in SpatialLayer for efficient indexed distance/intersection
    result = SpatialLayer(lines)
    
    if which == "roads":
        _roads_utm = result
    else:
        _water_utm = result
    return result


def load_schools_in_district(district_poly_utm, district_name: str):
    logger.info(f"Fetching schools for {district_name} from Supabase...")
    query = "SELECT id, name, geometry FROM mwi_education"
    gdf = gpd.read_postgis(query, con=engine, geom_col='geometry')
    gdf = gdf.to_crs(epsg=32736)
    
    schools = []
    for row in gdf.itertuples():
        pt_utm = row.geometry
        if not pt_utm or not pt_utm.is_valid or pt_utm.is_empty:
            continue
            
        if not district_poly_utm.contains(pt_utm):
            continue
            
        lng, lat = TO_WGS(pt_utm.x, pt_utm.y)
        name = str(row.name).strip() if row.name else "Unknown School"
        
        name_l = name.lower()
        if any(k in name_l for k in ("university", "college", "polytechnic", "tvet", "institute")):
            level = "tertiary"
        elif any(k in name_l for k in ("secondary", "cdss", "high school")):
            level = "secondary"
        else:
            level = "primary"
            
        schools.append({
            "id": row.id,
            "district_id": None,
            "name": name,
            "lat": round(lat, 6),
            "lng": round(lng, 6),
            "level": level,
            "students": 200,
            "status": "Active",
            "pt_utm": pt_utm,
        })
    return schools