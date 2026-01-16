from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta
from app.db.database import get_supabase
from app.models import schemas
from app.ml.crowding import classify_crowding
from app.ml.external_data import is_today_holiday, get_weather_status
from supabase import Client

router = APIRouter()

@router.delete("/cleanup")
def cleanup_old_data(hours: int = 24, supabase: Client = Depends(get_supabase)):
    """Delete flow data older than the specified number of hours (default: 24)"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection unavailable")

    cutoff_time = datetime.now() - timedelta(hours=hours)
    
    # Delete records older than cutoff_time
    response = (
        supabase.table("flow_data")
        .delete()
        .lt("timestamp", cutoff_time.isoformat())
        .execute()
    )

    return {
        "message": f"Cleanup complete",
        "deleted_count": len(response.data) if response.data else 0,
        "cutoff_time": cutoff_time.isoformat()
    }

@router.get("/", response_model=List[schemas.FlowDataResponse])
def get_flow_data(
    station_code: Optional[str] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    limit: int = Query(default=100, le=1000),
    supabase: Client = Depends(get_supabase)
):
    """Get flow data with optional filters"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection unavailable")

    query = supabase.table("flow_data").select("*")

    if station_code:
        query = query.eq("station_code", station_code)

    if start_time:
        query = query.gte("timestamp", start_time.isoformat())

    if end_time:
        query = query.lte("timestamp", end_time.isoformat())

    # Limit must be applied after filters, and range is used for offset/limit
    # range(0, limit - 1) gives 'limit' items
    query = query.order("timestamp", desc=True).limit(limit)
    
    response = query.execute()
    return response.data

@router.get("/latest/{station_code}", response_model=schemas.FlowDataResponse)
def get_latest_flow(station_code: str, supabase: Client = Depends(get_supabase)):
    """
    Get latest flow data for a station.
    Aggregates data across multiple lines if the station is an interchange.
    """
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection unavailable")

    # Fetch last 20 records to ensure we catch all lines
    response = (
        supabase.table("flow_data")
        .select("*")
        .eq("station_code", station_code)
        .order("timestamp", desc=True)
        .limit(20)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="No flow data found for this station")

    data = response.data
    
    # Group by line_code (use 'default' if line_code is missing/null)
    latest_per_line = {}
    for entry in data:
        line = entry.get("line_code") or "default"
        if line not in latest_per_line:
            latest_per_line[line] = entry
    
    # Aggregate
    aggregated_entry = list(latest_per_line.values())[0].copy() # Start with one entry as base
    
    crowding_levels = []
    frequencies = []
    next_trains = []
    delays = []
    timestamps = []

    level_map = {"low": 1, "medium": 2, "high": 3}
    rev_level_map = {1: "low", 2: "medium", 3: "high"}

    for line_entry in latest_per_line.values():
        # Crowding
        lvl = line_entry.get("crowding_level")
        if lvl in level_map:
            crowding_levels.append(level_map[lvl])
        
        # Frequency
        freq = line_entry.get("train_frequency")
        if freq is not None:
            frequencies.append(freq)
            
        # Next Train
        nt = line_entry.get("next_train_minutes")
        if nt is not None:
            next_trains.append(nt)
            
        # Delay
        delays.append(line_entry.get("is_delay", False))
        
        # Timestamp
        ts_str = line_entry.get("timestamp")
        if ts_str:
            timestamps.append(ts_str)

    # Apply Aggregation Logic
    if crowding_levels:
        max_crowding = max(crowding_levels)
        aggregated_entry["crowding_level"] = rev_level_map[max_crowding]
    
    if frequencies:
        # For dashboard, show the BEST frequency (min headway) available
        aggregated_entry["train_frequency"] = min(frequencies)
        
    if next_trains:
        aggregated_entry["next_train_minutes"] = min(next_trains)
        
    aggregated_entry["is_delay"] = any(delays)
    
    # Use latest timestamp
    if timestamps:
        aggregated_entry["timestamp"] = sorted(timestamps, reverse=True)[0]

    return aggregated_entry

@router.post("/", response_model=schemas.FlowDataResponse)
def create_flow_data(flow_data: schemas.FlowDataCreate, supabase: Client = Depends(get_supabase)):
    """Create new flow data entry"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection unavailable")

    # Calculate crowding level if not provided
    if flow_data.crowding_level is None and flow_data.next_train_minutes is not None:
        try:
            is_holiday = is_today_holiday()
            weather = get_weather_status()

            # Ensure timestamp is a datetime object
            hour = flow_data.timestamp.hour

            flow_data.crowding_level = classify_crowding(
                # NOTE: This endpoint receives pre-processed data where headway
                # (calculated as seq 3 ttnt - seq 2 ttnt) has already been computed
                # in the collection script. We use next_train_minutes here only as a
                # fallback proxy when the actual headway calculation isn't available.
                frequency=flow_data.next_train_minutes,
                hour=hour,
                is_holiday=is_holiday,
                is_rainy=weather["is_rainy"],
                is_delay=flow_data.is_delay or False
            )
        except Exception as e:
            # Fallback or log error
            print(f"Error calculating crowding level: {e}")
            pass

    response = supabase.table("flow_data").insert(flow_data.model_dump(mode='json')).execute()
    return response.data[0]
