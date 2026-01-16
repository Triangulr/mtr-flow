from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime, timedelta
from app.db.database import get_supabase
from app.models import schemas
from supabase import Client

router = APIRouter()

@router.get("/{station_code}", response_model=List[schemas.PredictionResponse])
def get_predictions(
    station_code: str,
    hours_ahead: int = 24,
    supabase: Client = Depends(get_supabase)
):
    """Get predictions for a station for the next N hours"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection unavailable")

    start_time = datetime.utcnow()
    end_time = start_time + timedelta(hours=hours_ahead)

    response = (
        supabase.table("predictions")
        .select("*")
        .eq("station_code", station_code)
        .gte("prediction_timestamp", start_time.isoformat())
        .lte("prediction_timestamp", end_time.isoformat())
        .order("prediction_timestamp")
        .execute()
    )

    return response.data

@router.post("/", response_model=schemas.PredictionResponse)
def create_prediction(prediction: schemas.PredictionCreate, supabase: Client = Depends(get_supabase)):
    """Create a new prediction"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    response = supabase.table("predictions").insert(prediction.model_dump(mode='json')).execute()
    return response.data[0]

@router.get("/latest/{station_code}", response_model=schemas.PredictionResponse)
def get_latest_prediction(station_code: str, supabase: Client = Depends(get_supabase)):
    """Get the most recent prediction for a station"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection unavailable")

    response = (
        supabase.table("predictions")
        .select("*")
        .eq("station_code", station_code)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="No predictions found for this station")

    return response.data[0]
