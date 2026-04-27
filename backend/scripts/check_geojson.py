import json
import os

data_dir = r"c:\Users\COMADMIN\MY FINAL YEAR PROJECT\edumap-malawi\backend\data\EduMapdata"
files = {
    "districts": "districts.geojson",
    "roads": "roads.geojson",
    "schools": "schools.geojson",
    "water": "water.geojson"
}

for name, filename in files.items():
    filepath = os.path.join(data_dir, filename)
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
            # GeoJSON usually has type="FeatureCollection" and features=[]
            if "features" in data and len(data["features"]) > 0:
                first_feature = data["features"][0]
                geom_type = first_feature.get("geometry", {}).get("type", "Unknown")
                properties = list(first_feature.get("properties", {}).keys())
                
                print(f"\n[{name.upper()}] {filename}")
                print(f"  Total Features: {len(data['features'])}")
                print(f"  Geometry Type: {geom_type}")
                print(f"  Properties: {properties}")
            else:
                print(f"\n[{name.upper()}] {filename} does not contain features array.")
                
    except Exception as e:
        print(f"Error reading {filename}: {e}")
