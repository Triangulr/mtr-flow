# Phase 1 Data Analysis
Run date (UTC): 2026-02-03 02:13:06 UTC
## Dataset Overview
- Total rows: 2276
- Date range: 2026-02-03 02:03:45 UTC → 2026-02-03 02:13:01 UTC
- Distinct stations (stations table): 97
- Null `crowding_level`: 0 (0.0%)
- Columns in `flow_data`: crowding_level, id, is_delay, line_code, next_train_minutes, station_code, timestamp, train_frequency
## 30-Day Coverage (Hourly Buckets)
- Window: 2026-02-03 02:13:01 UTC minus 30 days
- Stations meeting ≥30 days data AND ≤20% missing: 0
- Stations <30 days of data: 97

Top stations with <30 days (by days with data):
| Station | Days with data |
|---|---|
| ADM | 1 |
| AIR | 1 |
| AUS | 1 |
| AWE | 1 |
| CAB | 1 |
| CEN | 1 |
| CHH | 1 |
| CHW | 1 |
| CIO | 1 |
| CKT | 1 |

- Stations with >20% missing hours: 97

Top stations by missing % (last 30 days):
| Station | Missing % |
|---|---|
| ADM | 99.86 |
| AIR | 99.86 |
| AUS | 99.86 |
| AWE | 99.86 |
| CAB | 99.86 |
| CEN | 99.86 |
| CHH | 99.86 |
| CHW | 99.86 |
| CIO | 99.86 |
| CKT | 99.86 |

## Crowding Distribution (Last 30 Days)
| Level | Count |
|---|---|
| low | 1029 |
| medium | 1247 |
| high | 0 |
| null | 0 |

Top stations by `high` crowding share (last 30 days):
| Station | High % | Samples |
|---|---|
| ADM | 0.0 | 76 |
| AIR | 0.0 | 19 |
| AUS | 0.0 | 19 |
| AWE | 0.0 | 17 |
| CAB | 0.0 | 19 |
| CEN | 0.0 | 38 |
| CHH | 0.0 | 19 |
| CHW | 0.0 | 19 |
| CIO | 0.0 | 19 |
| CKT | 0.0 | 19 |

## Export
- Exported last 30 days to `ml/data/flow_data_last_30_days.csv.gz` (columns: station_code, timestamp, crowding_level, next_train_minutes, train_frequency, line_code, is_delay)
