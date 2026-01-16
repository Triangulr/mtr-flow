from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.db.database import get_supabase
from app.models import schemas
from app.ml.mtr_api import get_station_trains
from supabase import Client

router = APIRouter()

@router.get("/", response_model=List[schemas.StationResponse])
def get_stations(skip: int = 0, limit: int = 100, supabase: Client = Depends(get_supabase)):
    """Get all stations"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    response = supabase.table("stations").select("*").range(skip, skip + limit - 1).execute()
    return response.data

@router.get("/{code}", response_model=schemas.StationResponse)
def get_station(code: str, supabase: Client = Depends(get_supabase)):
    """Get station by code"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    response = supabase.table("stations").select("*").eq("code", code).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Station not found")
    return response.data[0]

@router.post("/", response_model=schemas.StationResponse)
def create_station(station: schemas.StationCreate, supabase: Client = Depends(get_supabase)):
    """Create a new station"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    response = supabase.table("stations").insert(station.model_dump()).execute()
    return response.data[0]

@router.get("/{code}/trains", response_model=schemas.StationTrainsResponse)
def get_station_train_arrivals(code: str, supabase: Client = Depends(get_supabase)):
    """Get real-time train arrivals for a station across all lines"""
    try:
        # Get station name from database
        station_name = code
        if supabase:
            response = supabase.table("stations").select("name").eq("code", code.upper()).execute()
            if response.data and len(response.data) > 0:
                station_name = response.data[0]["name"]

        # Fetch train data from MTR API
        trains_data = get_station_trains(code)
        trains_data["station_name"] = station_name

        return trains_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch train arrivals: {str(e)}")
