import requests
import datetime
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

# Cache for holidays to avoid fetching every request
_HOLIDAYS_CACHE = {
    "data": set(),
    "last_fetched": None
}

def get_public_holidays() -> set[datetime.date]:
    """
    Fetch Hong Kong public holidays from 1823.gov.hk.
    Returns a set of datetime.date objects.
    """
    global _HOLIDAYS_CACHE
    
    # Refresh cache if empty or older than 24 hours
    now = datetime.datetime.now()
    if (not _HOLIDAYS_CACHE["data"] or 
        not _HOLIDAYS_CACHE["last_fetched"] or 
        (now - _HOLIDAYS_CACHE["last_fetched"]).total_seconds() > 86400):
        
        try:
            url = "https://www.1823.gov.hk/common/ical/en.json"
            response = requests.get(url, timeout=5)
            response.raise_for_status()
            data = response.json()
            
            holidays = set()
            if "vcalendar" in data and len(data["vcalendar"]) > 0:
                events = data["vcalendar"][0].get("vevent", [])
                for event in events:
                    # dtstart is typically ["20240101", {"value": "DATE"}]
                    if "dtstart" in event and isinstance(event["dtstart"], list) and len(event["dtstart"]) > 0:
                        date_str = event["dtstart"][0]
                        try:
                            # Parse YYYYMMDD
                            dt = datetime.datetime.strptime(date_str, "%Y%m%d").date()
                            holidays.add(dt)
                        except ValueError:
                            continue
            
            _HOLIDAYS_CACHE["data"] = holidays
            _HOLIDAYS_CACHE["last_fetched"] = now
            logger.info(f"Refreshed holiday cache. Found {len(holidays)} holidays.")
            
        except Exception as e:
            logger.error(f"Failed to fetch public holidays: {e}")
            # If fetch fails, return existing cache (even if old) or empty set
            return _HOLIDAYS_CACHE["data"]

    return _HOLIDAYS_CACHE["data"]

def is_today_holiday() -> bool:
    """Check if today is a public holiday."""
    today = datetime.datetime.now().date()
    holidays = get_public_holidays()
    return today in holidays

def get_weather_status() -> Dict:
    """
    Fetch current weather status from Hong Kong Observatory.
    Returns a dict with 'is_rainy' (bool) and 'warnings' (list of str).
    """
    try:
        url = "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en"
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        warnings = data.get("warningMessage", [])
        
        # Determine if it's rainy
        # 1. Check for Rainstorm warnings
        is_rainy = False
        rainstorm_keywords = ["Amber Rainstorm", "Red Rainstorm", "Black Rainstorm"]
        for w in warnings:
            if any(k in w for k in rainstorm_keywords):
                is_rainy = True
                break
        
        # 2. Check rainfall data if no warning yet
        # If any major urban district has > 10mm rainfall (arbitrary threshold for "wet")
        if not is_rainy and "rainfall" in data and "data" in data["rainfall"]:
            # Urban districts to check
            urban_districts = [
                "Central & Western District", "Wan Chai", "Eastern District", 
                "Southern District", "Yau Tsim Mong", "Sham Shui Po", 
                "Kowloon City", "Wong Tai Sin", "Kwun Tong"
            ]
            
            for district_data in data["rainfall"]["data"]:
                if district_data.get("place") in urban_districts:
                    # 'max' is the max rainfall in mm
                    if district_data.get("max", 0) > 10:
                        is_rainy = True
                        break
                        
        return {
            "is_rainy": is_rainy,
            "warnings": warnings,
            "temperature": data.get("temperature", {}).get("data", [{}])[0].get("value") # Just get first reading
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch weather data: {e}")
        return {"is_rainy": False, "warnings": []}
