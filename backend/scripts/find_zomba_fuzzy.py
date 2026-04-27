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
            
            # Check all string values in properties
            found = False
            for val in props.values():
                if isinstance(val, str) and "zomba" in val.lower():
                    found = True
                    break
                    
            if found:
                zomba_schools.append(feature)
                
        print(f"Total schools with 'Zomba' anywhere in properties: {len(zomba_schools)}")
        if zomba_schools:
            print("Samples:")
            for s in zomba_schools[:3]:
                print(s["properties"])
            
except Exception as e:
    print(f"Error: {e}")
