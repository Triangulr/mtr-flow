def classify_crowding(frequency: float, hour: int, is_holiday: bool = False, is_rainy: bool = False, is_delay: bool = False) -> str:
    """
    Classify crowding level based on service frequency (headway), holidays, weather, and delays.

    Logic:
    - Shorter headways (frequency) = Higher passenger volume/demand = Higher crowding.
    - Holidays: Rush hour logic is disabled (treated as off-peak).
    - Rain: "Umbrella Effect" increases crowding sensitivity (thresholds relaxed by ~0.5m).
    - Delays: If a delay is reported, crowding is significantly higher due to passenger accumulation.
    
    Args:
        frequency: Train service frequency (headway) in minutes. (Can fall back to ttnt if frequency unknown)
        hour: Hour of the day (0-23)
        is_holiday: Whether today is a public holiday
        is_rainy: Whether there is significant rainfall/warnings
        is_delay: Whether a delay is reported by MTR
        
    Returns:
        str: "low", "medium", or "high"
    """
    # 1. Determine effective rush hour
    # On holidays, there is no traditional commuter rush hour
    is_rush_hour = False
    if not is_holiday:
        if (7 <= hour <= 9) or (17 <= hour <= 19):
            is_rush_hour = True

    # 2. Adjust thresholds for weather
    # Rain makes platforms busier (umbrellas, short trips).
    # We increase sensitivity by treating slightly longer wait times as "crowded"
    rain_adj = 0.5 if is_rainy else 0.0

    if is_rush_hour:
        # Rush Hour Logic
        # Delay Override: If there is a delay during rush hour, it's automatically HIGH crowding.
        if is_delay:
            return "high"

        # Strict: < 2.5m is High.
        # With rain: < 3.0m is High.
        if frequency < (2.5 + rain_adj):
            return "high"
        elif frequency < (4.0 + rain_adj):
            return "medium"
        else:
            return "low"
    else:
        # Off-Peak / Holiday Logic
        # Delay Override: If there is a delay off-peak, upgrade to at least MEDIUM.
        if is_delay:
            return "medium"

        # Standard: < 3.0m is Medium.
        # With rain: < 3.5m is Medium.
        if frequency < (3.0 + rain_adj):
            return "medium"
        else:
            return "low"