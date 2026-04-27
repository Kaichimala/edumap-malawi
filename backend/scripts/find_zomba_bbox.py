import json
import os

data_dir = r"c:\Users\COMADMIN\MY FINAL YEAR PROJECT\edumap-malawi\backend\data\EduMapdata"
filepath = os.path.join(data_dir, "schools.geojson")

try:
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
        zomba_bbox_schools = []
        for feature in data.get("features", []):
            geom = feature.get("geometry", {})
            if geom and geom.get("type") == "Point":
                coords = geom.get("coordinates", [])
                if len(coords) >= 2:
                    lng, lat = coords[0], coords[1]
                    # Zomba rough bounding box
                    if -15.6 <= lat <= -15.2 and 35.1 <= lng <= 35.5:
                        zomba_bbox_schools.append(feature)
                        
        print(f"Total schools in Zomba BBox: {len(zomba_bbox_schools)}")
        if zomba_bbox_schools:
            print("Samples:")
            for s in zomba_bbox_schools[:5]:
                print(s["properties"]["name"], "at", s["geometry"]["coordinates"])
            
except Exception as e:
    print(f"Error: {e}")
