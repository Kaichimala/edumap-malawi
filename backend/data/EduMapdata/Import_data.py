import geopandas as gpd
from sqlalchemy import create_engine
import os

# 1. Connection String (Using your exact Pooler details)
DB_URL = "postgresql://postgres.mwwgqywweinaajrihsdf:Edumap112233@.@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require"
engine = create_engine(DB_URL)

# 2. File Mapping (Case sensitive based on your image)
data_files = {
    "schools.geojson": "mwi_education",
    "roads.geojson": "mwi_roads",
    "water.geojson": "mwi_waterways",
    "districts.geojson": "mwi_districts"
}

def upload_to_supabase(file_path, table_name):
    if not os.path.exists(file_path):
        print(f"⚠️ Warning: {file_path} not found in folder. Skipping.")
        return

    try:
        print(f"--- Loading {file_path} ---")
        # Load the GeoJSON
        gdf = gpd.read_file(file_path)

        # Standardize to WGS84 for Leaflet
        if gdf.crs != "EPSG:4326":
            print(f"Projecting {table_name} to EPSG:4326...")
            gdf = gdf.to_crs("EPSG:4326")

        print(f"Uploading to Supabase...")
        # Upload to PostGIS (this handles the geometry type automatically)
        gdf.to_postgis(table_name, engine, if_exists='replace', index=False)
        print(f"✅ Success: {table_name} table created.\n")
        
    except Exception as e:
        print(f"❌ Failed to upload {table_name}: {e}\n")

if __name__ == "__main__":
    for file, table in data_files.items():
        upload_to_supabase(file, table)