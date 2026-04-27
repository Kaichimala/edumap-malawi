import os
import pyproj

# ── Paths ──────────────────────────────────────
# Districts, roads, waterways, and schools are now loaded from Supabase PostGIS.
# Only the DEM (terrain raster) is still read from a local file.
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "EduMapdata")
DEM_PATH = os.path.join(DATA_DIR, "Dem.tif")

# ── CRS Transformers ───────────────────────────
WGS84  = pyproj.CRS("EPSG:4326")
UTM36S = pyproj.CRS("EPSG:32736")
TO_UTM = pyproj.Transformer.from_crs(WGS84, UTM36S, always_xy=True).transform
TO_WGS = pyproj.Transformer.from_crs(UTM36S, WGS84, always_xy=True).transform

# ── District ID → Name Mapping ─────────────────
DISTRICT_ID_TO_NAME = {
    1:  "Lilongwe",   2:  "Blantyre",    3:  "Mzuzu",
    4:  "Zomba",      5:  "Kasungu",     6:  "Mangochi",
    7:  "Salima",     8:  "Dedza",       9:  "Machinga",
    10: "Chikwawa",   11: "Thyolo",      12: "Mulanje",
    13: "Nsanje",     14: "Mwanza",      15: "Balaka",
    16: "Ncheu",      17: "Mchinji",     18: "Dowa",
    19: "Ntchisi",    20: "Nkhotakota",  21: "Nkhata Bay",
    22: "Rumphi",     23: "Karonga",     24: "Chitipa",
    25: "Neno",       26: "Likoma",      27: "Phalombe",
    28: "Chiradzulu",
}

# ── Buffer Radii ───────────────────────────────
BUFFER_RADII = {
    "primary":   {"high": 3000, "medium": 2000, "low": 1500},
    "secondary": {"high": 5000, "medium": 3500, "low": 2500},
    "tertiary":  {"high": 10000, "medium": 7000, "low": 5000},
}