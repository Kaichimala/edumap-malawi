import json
import os

data_dir = r"c:\Users\COMADMIN\MY FINAL YEAR PROJECT\edumap-malawi\backend\data\EduMapdata"
filepath = os.path.join(data_dir, "schools.geojson")

try:
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
        zomba_schools = []
        for feature in data.get("features", []):
            props = feature.get("properties", {})
            addr_city = props.get("addr_city", "")
            addr_full = props.get("addr_full", "")
            
            if addr_city and "zomba" in str(addr_city).lower():
                zomba_schools.append(feature)
            elif addr_full and "zomba" in str(addr_full).lower():
                zomba_schools.append(feature)
                
        print(f"Total schools found in Zomba: {len(zomba_schools)}")
        if zomba_schools:
            print("Sample:")
            print(zomba_schools[0]["properties"])
            
except Exception as e:
    print(f"Error: {e}")
