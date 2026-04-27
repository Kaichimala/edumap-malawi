import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import districts, schools, analysis

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="EduMap Malawi Suitability API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173",
                   "http://localhost:1803", "http://127.0.0.1:1803"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(districts.router, prefix="/api", tags=["Districts"])
app.include_router(schools.router,   prefix="/api", tags=["Schools"])
app.include_router(analysis.router,  prefix="/api", tags=["Analysis"])

@app.get("/")
def read_root():
    return {"message": "EduMap Malawi PyLUSAT API is running."}