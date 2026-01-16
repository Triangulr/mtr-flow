"""
MTR Real-Time Train API Integration
"""
import requests
import json
import logging
from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path
from functools import lru_cache

logger = logging.getLogger(__name__)

# Load station-to-lines mapping
STATION_LINES_PATH = Path(__file__).parent.parent / "data" / "station_lines.json"

with open(STATION_LINES_PATH, 'r') as f:
    STATION_LINES: Dict[str, List[str]] = json.load(f)

# Line metadata
LINE_INFO = {
    "ISL": {"name": "Island Line", "color": "#007DC5"},
    "TWL": {"name": "Tsuen Wan Line", "color": "#E2231A"},
    "KTL": {"name": "Kwun Tong Line", "color": "#00AB4E"},
    "TKL": {"name": "Tseung Kwan O Line", "color": "#A35EB5"},
    "TCL": {"name": "Tung Chung Line", "color": "#F38B00"},
    "AEL": {"name": "Airport Express", "color": "#007078"},
    "DRL": {"name": "Disneyland Resort Line", "color": "#E777CB"},
    "EAL": {"name": "East Rail Line", "color": "#53C7E3"},
    "TML": {"name": "Tuen Ma Line", "color": "#923011"},
    "SIL": {"name": "South Island Line", "color": "#B6BD00"}
}

MTR_API_URL = "https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php"

@lru_cache(maxsize=100)
def _fetch_line_schedule_cached(line_code: str, station_code: str, cache_key: str) -> Optional[Dict]:
    """
    Internal cached function to fetch train schedule from MTR API.
    cache_key includes timestamp to enable time-based cache invalidation.
    """
    try:
        params = {
            "line": line_code,
            "sta": station_code
        }
        response = requests.get(MTR_API_URL, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()

        if data.get("status") != 1:
            logger.warning(f"MTR API returned non-success status for {line_code}-{station_code}: {data.get('message')}")
            return None

        return data

    except requests.RequestException as e:
        logger.error(f"Failed to fetch MTR schedule for {line_code}-{station_code}: {e}")
        return None
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse MTR API response for {line_code}-{station_code}: {e}")
        return None

def fetch_line_schedule(line_code: str, station_code: str) -> Optional[Dict]:
    """
    Fetch train schedule from MTR API with 30-second caching.
    """
    # Create cache key that changes every 30 seconds
    current_time = datetime.now()
    cache_key = f"{current_time.year}-{current_time.month}-{current_time.day}-{current_time.hour}-{current_time.minute}-{current_time.second // 30}"

    return _fetch_line_schedule_cached(line_code, station_code, cache_key)

def calculate_frequency(trains: List[Dict]) -> Optional[float]:
    """
    Calculate frequency (headway) from a list of trains.
    Headway = seq 3 ttnt - seq 2 ttnt (the time gap between train 2 and train 3 arriving)
    """
    if not trains:
        return None

    # Build a dict mapping seq -> ttnt for valid trains
    seq_to_ttnt = {}
    for t in trains:
        if t.get("valid") == "Y" and t.get("seq") is not None and t.get("ttnt") is not None:
            try:
                seq_num = int(t["seq"])
                ttnt_val = float(t["ttnt"])
                seq_to_ttnt[seq_num] = ttnt_val
            except (ValueError, TypeError):
                continue

    # Prefer seq 3 - seq 2
    if 3 in seq_to_ttnt and 2 in seq_to_ttnt:
        return abs(seq_to_ttnt[3] - seq_to_ttnt[2])

    # Fallback to seq 2 - seq 1
    if 2 in seq_to_ttnt and 1 in seq_to_ttnt:
        return abs(seq_to_ttnt[2] - seq_to_ttnt[1])

    return None

def get_station_trains(station_code: str) -> Dict:
    """
    Get all train arrivals for a station across all lines it serves.

    Args:
        station_code: 3-letter station code (e.g., 'CEN')

    Returns:
        Dict with structure:
        {
            "station_code": "CEN",
            "station_name": "Central",
            "timestamp": "2026-01-15 10:30:00",
            "lines": [
                {
                    "line_code": "ISL",
                    "line_name": "Island Line",
                    "color": "#007DC5",
                    "up_trains": [...],
                    "down_trains": [...],
                    "frequency_up": 3.0,
                    "frequency_down": 4.0
                }
            ]
        }
    """
    station_code = station_code.upper()

    # Get lines serving this station
    line_codes = STATION_LINES.get(station_code, [])

    if not line_codes:
        logger.warning(f"No lines found for station {station_code}")
        return {
            "station_code": station_code,
            "station_name": station_code,
            "timestamp": datetime.now().isoformat(),
            "lines": []
        }

    lines_data = []
    station_name = station_code  # Default to code
    timestamp = None

    for line_code in line_codes:
        api_response = fetch_line_schedule(line_code, station_code)

        if not api_response:
            continue

        # Extract timestamp
        if not timestamp:
            timestamp = api_response.get("curr_time", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

        # Find the data for this line-station combination
        data_key = f"{line_code}-{station_code}"
        line_data = api_response.get("data", {}).get(data_key, {})

        if not line_data:
            logger.warning(f"No data found for {data_key} in API response")
            continue

        # Raw lists for frequency calculation
        raw_up = line_data.get("UP", [])
        raw_down = line_data.get("DOWN", [])

        # Parse UP and DOWN trains
        up_trains = []
        down_trains = []

        for train in raw_up:
            if train.get("valid") == "Y":
                up_trains.append({
                    "platform": train.get("plat", ""),
                    "destination": train.get("dest", ""),
                    "destination_code": train.get("dest", ""),
                    "time": train.get("time", ""),
                    "ttnt": train.get("ttnt", ""),
                    "valid": True
                })

        for train in raw_down:
            if train.get("valid") == "Y":
                down_trains.append({
                    "platform": train.get("plat", ""),
                    "destination": train.get("dest", ""),
                    "destination_code": train.get("dest", ""),
                    "time": train.get("time", ""),
                    "ttnt": train.get("ttnt", ""),
                    "valid": True
                })

        # Calculate frequency
        freq_up = calculate_frequency(raw_up)
        freq_down = calculate_frequency(raw_down)

        # Get line info
        line_info = LINE_INFO.get(line_code, {
            "name": line_code,
            "color": "#666666"
        })

        lines_data.append({
            "line_code": line_code,
            "line_name": line_info["name"],
            "color": line_info["color"],
            "up_trains": up_trains,
            "down_trains": down_trains,
            "frequency_up": freq_up,
            "frequency_down": freq_down
        })

    return {
        "station_code": station_code,
        "station_name": station_name,
        "timestamp": timestamp or datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "lines": lines_data
    }

def get_lines_for_station(station_code: str) -> List[str]:
    """
    Get list of line codes that serve a given station.

    Args:
        station_code: 3-letter station code

    Returns:
        List of line codes (e.g., ['ISL', 'TWL'])
    """
    return STATION_LINES.get(station_code.upper(), [])
