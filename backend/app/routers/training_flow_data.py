from fastapi import APIRouter, Depends, HTTPException
from app.db.database import get_supabase
from app.models import schemas
from app.ml.crowding import classify_crowding
from app.ml.external_data import is_today_holiday, get_weather_status
from supabase import Client

router = APIRouter()


@router.post("/", response_model=schemas.FlowDataResponse)
def create_training_flow_data(
    flow_data: schemas.FlowDataCreate, supabase: Client = Depends(get_supabase)
):
    """Insert flow data into training_flow_data table."""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection unavailable")

    # Calculate crowding level if not provided
    if flow_data.crowding_level is None and flow_data.next_train_minutes is not None:
        try:
            is_holiday = is_today_holiday()
            weather = get_weather_status()
            hour = flow_data.timestamp.hour
            flow_data.crowding_level = classify_crowding(
                frequency=flow_data.next_train_minutes,
                hour=hour,
                is_holiday=is_holiday,
                is_rainy=weather["is_rainy"],
                is_delay=flow_data.is_delay or False,
            )
        except Exception as e:
            print(f"Error calculating crowding level: {e}")

    response = (
        supabase.table("training_flow_data")
        .insert(flow_data.model_dump(mode="json"))
        .execute()
    )

    return response.data[0]
