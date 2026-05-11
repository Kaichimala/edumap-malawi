import geopandas as gpd
# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
import sys

def main():
    shp_path = r"C:\Users\ronni\Downloads\COM413_4-1-RetrievalData\COM413_4-1-RetrievalData (Unzipped Files)\mw_schools.shp"
    
    print("Reading shapefile...")
    try:
        gdf = gpd.read_file(shp_path)
    except Exception as e:
        print(f"Error reading shapefile: {e}")
        return

    print("Original CRS:", gdf.crs)
    # Ensure it's in WGS84 for PostGIS mapping correctly
    if gdf.crs is None or gdf.crs.to_string() != "EPSG:4326":
        print("Converting to EPSG:4326...")
        gdf = gdf.to_crs("EPSG:4326")
    
    print("Connecting to Supabase Database via Supavisor pooler (IPv4)...")
    user = "postgres.mwwgqywweinaajrihsdf"
    password = "aEfKCVjg1G2XraqS"
    host = "aws-1-eu-west-1.pooler.supabase.com"
    port = "6543"
    dbname = "postgres"
    
    # Create the connection URL
    db_url = f"postgresql://{user}:{password}@{host}:{port}/{dbname}"
    engine = create_engine(db_url)
    
    table_name = "mwi_schools_shp"
    
    print(f"Uploading {len(gdf)} records to table '{table_name}'...")
    try:
        # to_postgis uses geoalchemy2 under the hood to correctly configure geometry types
        gdf.to_postgis(table_name, engine, if_exists='replace', index=False)
        print("Successfully uploaded the schools data to Supabase!")
    except Exception as e:
        print(f"An error occurred during upload: {e}", file=sys.stderr)

if __name__ == "__main__":
    main()
