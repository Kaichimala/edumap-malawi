from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import geopandas as gpd
from sqlalchemy import create_engine, text
import os
import shutil
import tempfile
import zipfile
from typing import Optional

app = FastAPI()

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Database credentials (ideally these should be in environment variables)
DB_USER = "postgres.mwwgqywweinaajrihsdf"
DB_PASSWORD = "aEfKCVjg1G2XraqS"
DB_HOST = "aws-1-eu-west-1.pooler.supabase.com"
DB_PORT = "6543"
DB_NAME = "postgres"

DB_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DB_URL)

@app.get("/datasets")
async def list_datasets():
    """
    Returns a list of all registered datasets from the app_datasets table.
    """
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT table_name, display_name, record_count, created_at FROM public.app_datasets ORDER BY created_at DESC"))
            datasets = [
                {
                    "table_name": row[0],
                    "display_name": row[1],
                    "record_count": row[2],
                    "created_at": row[3].isoformat() if row[3] else None
                }
                for row in result
            ]
        return datasets
    except Exception as e:
        print(f"Error listing datasets: {e}")
        return []

@app.post("/upload")
async def upload_dataset(
    file: Optional[UploadFile] = File(None),
    table_name: str = Form(...),
    replace: bool = Form(True),
    local_path: Optional[str] = Form(None)
):
    """
    Uploads a geospatial dataset (CSV, GeoJSON, or Zipped Shapefile) to Supabase,
    either from an uploaded file or an already extracted local folder path.
    """
    temp_dir = tempfile.mkdtemp()
    read_path = None
    
    try:
        if local_path:
            # Handle local path (extracted folder or specific file)
            if not os.path.exists(local_path):
                raise HTTPException(status_code=400, detail=f"Local path does not exist: {local_path}")
            
            if os.path.isdir(local_path):
                # If it's a directory, search recursively for the first .shp file
                shp_files = []
                for root, dirs, files in os.walk(local_path):
                    for f in files:
                        if f.endswith(".shp"):
                            shp_files.append(os.path.join(root, f))
                
                if not shp_files:
                    raise HTTPException(status_code=400, detail=f"No .shp file found in folder: {local_path}")
                read_path = shp_files[0]
            else:
                read_path = local_path
        elif file:
            # Save the uploaded file
            file_path = os.path.join(temp_dir, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Handle zipped shapefiles
            read_path = file_path
            if file.filename.endswith(".zip"):
                with zipfile.ZipFile(file_path, 'r') as zip_ref:
                    zip_ref.extractall(temp_dir)
                    
                    # Recursive search for .shp file (handles nested folders)
                    shp_files = []
                    for root, dirs, files in os.walk(temp_dir):
                        for f in files:
                            if f.endswith(".shp"):
                                shp_files.append(os.path.join(root, f))
                    
                    if not shp_files:
                        raise HTTPException(status_code=400, detail="No .shp file found in ZIP archive.")
                    read_path = shp_files[0]
        else:
            raise HTTPException(status_code=400, detail="Either a file must be uploaded or a local path must be provided.")
        
        # Read the file with GeoPandas
        print(f"Reading file: {read_path}")
        gdf = gpd.read_file(read_path)
        
        # Ensure CRS is WGS84
        if gdf.crs is None or gdf.crs.to_string() != "EPSG:4326":
            print("Converting to EPSG:4326...")
            gdf = gdf.to_crs("EPSG:4326")
        
        # Upload to PostGIS
        if_exists = 'replace' if replace else 'append'
        print(f"Uploading {len(gdf)} records to '{table_name}'...")
        gdf.to_postgis(table_name, engine, if_exists=if_exists, index=False)
        
        # Track the dataset in app_datasets table
        try:
            with engine.connect() as conn:
                # Create table if not exists
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS public.app_datasets (
                        id SERIAL PRIMARY KEY,
                        table_name TEXT UNIQUE NOT NULL,
                        display_name TEXT,
                        record_count INTEGER,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    )
                """))
                # Insert or Update metadata
                conn.execute(text(f"""
                    INSERT INTO public.app_datasets (table_name, display_name, record_count)
                    VALUES ('{table_name}', '{table_name.replace('_', ' ').title()}', {len(gdf)})
                    ON CONFLICT (table_name) DO UPDATE SET 
                        record_count = EXCLUDED.record_count,
                        created_at = NOW()
                """))
                conn.commit()
        except Exception as meta_e:
            print(f"Warning: Could not update app_datasets metadata: {meta_e}")

        return {
            "status": "success",
            "message": f"Successfully uploaded {len(gdf)} records to {table_name}",
            "table": table_name,
            "count": len(gdf)
        }
        
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        shutil.rmtree(temp_dir)

@app.delete("/delete/{table_name}")
async def delete_dataset(table_name: str):
    """
    Drops a geospatial table and removes its metadata from app_datasets.
    """
    try:
        with engine.connect() as conn:
            # Drop the actual data table
            conn.execute(text(f"DROP TABLE IF EXISTS public.{table_name}"))
            
            # Remove metadata
            conn.execute(text(f"DELETE FROM public.app_datasets WHERE table_name = '{table_name}'"))
            
            conn.commit()
            
        return {"status": "success", "message": f"Successfully deleted dataset {table_name}"}
    except Exception as e:
        print(f"Error deleting dataset: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
