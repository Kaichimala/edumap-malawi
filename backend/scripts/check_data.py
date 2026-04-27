import geopandas as gpd
import rasterio
import os

data_dir = r"c:\Users\COMADMIN\MY FINAL YEAR PROJECT\edumap-malawi\backend\data\EduMapdata"
files = {
    "districts": "districts.geojson",
    "roads": "roads.geojson",
    "schools": "schools.geojson",
    "water": "water.geojson"
}

print("--- VECTOR DATA ANALYSIS ---")
for name, filename in files.items():
    filepath = os.path.join(data_dir, filename)
    try:
        gdf = gpd.read_file(filepath, rows=5) # just read a few rows for schema
        crs = gdf.crs
        geom_type = gdf.geom_type.unique()
        columns = list(gdf.columns)
        print(f"\n[{name.upper()}] {filename}")
        print(f"  CRS: {crs}")
        print(f"  Geometry: {geom_type}")
        print(f"  Columns: {columns[:5]} {'...' if len(columns)>5 else ''}")
    except Exception as e:
        print(f"  Error reading {filename}: {e}")

print("\n--- RASTER DATA ANALYSIS ---")
dem_path = os.path.join(data_dir, "Dem.tif")
try:
    with rasterio.open(dem_path) as src:
        print(f"\n[DEM] Dem.tif")
        print(f"  CRS: {src.crs}")
        print(f"  Width/Height: {src.width}x{src.height}")
        print(f"  Resolution: {src.res}")
        print(f"  Bounds: {src.bounds}")
        print(f"  NoData: {src.nodata}")
except Exception as e:
    print(f"  Error reading Dem.tif: {e}")
