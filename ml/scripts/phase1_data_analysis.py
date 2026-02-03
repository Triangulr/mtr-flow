#!/usr/bin/env python3
"""
Phase 1 data analysis for AI prediction roadmap.
Exports last-30-days flow_data and writes a data quality report.
"""
from __future__ import annotations

import csv
import gzip
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import psycopg2
import requests
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

ML_ROOT = Path(__file__).resolve().parents[1]
ROOT = ML_ROOT.parent
ENV_PATH = ROOT / "backend" / ".env"

load_dotenv(ENV_PATH)

DATABASE_URL = os.getenv("DATABASE_URL")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_PUBLISHABLE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY")

engine = create_engine(DATABASE_URL) if DATABASE_URL else None

REPORT_DIR = ML_ROOT / "docs"
EXPORT_DIR = ML_ROOT / "data"
REPORT_DIR.mkdir(parents=True, exist_ok=True)
EXPORT_DIR.mkdir(parents=True, exist_ok=True)


class SupabaseRestClient:
    def __init__(self, url: str, key: str) -> None:
        self.base_url = url.rstrip("/") + "/rest/v1"
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }

    def get(self, table: str, params: dict, prefer_count: bool = False) -> requests.Response:
        headers = dict(self.headers)
        if prefer_count:
            headers["Prefer"] = "count=exact"
        response = requests.get(
            f"{self.base_url}/{table}",
            params=params,
            headers=headers,
            timeout=30,
        )
        response.raise_for_status()
        return response

    def count(self, table: str, filters: Optional[dict] = None) -> int:
        params = {"select": "id", "limit": 1, "offset": 0}
        if filters:
            params.update(filters)
        response = self.get(table, params=params, prefer_count=True)
        content_range = response.headers.get("Content-Range") or response.headers.get("content-range")
        if content_range and "/" in content_range:
            total = content_range.split("/")[-1]
            return int(total)
        data = response.json()
        return len(data)

    def fetch_first(self, table: str, params: dict) -> Optional[dict]:
        response = self.get(table, params=params)
        data = response.json()
        if not data:
            return None
        return data[0]

    def fetch_all(self, table: str, params: dict, page_size: int = 5000) -> List[dict]:
        items: List[dict] = []
        offset = 0
        while True:
            page_params = dict(params)
            page_params["limit"] = page_size
            page_params["offset"] = offset
            response = self.get(table, params=page_params)
            page = response.json()
            if not page:
                break
            items.extend(page)
            if len(page) < page_size:
                break
            offset += page_size
        return items


def fetch_one(query: str, params: Optional[dict] = None) -> dict:
    if not engine:
        raise RuntimeError("Database engine not configured")
    with engine.connect() as conn:
        result = conn.execute(text(query), params or {})
        return dict(result.mappings().one())


def fetch_all(query: str, params: Optional[dict] = None) -> List[dict]:
    if not engine:
        raise RuntimeError("Database engine not configured")
    with engine.connect() as conn:
        result = conn.execute(text(query), params or {})
        return [dict(row) for row in result.mappings().all()]


def fmt_dt(value: Optional[datetime]) -> str:
    if not value:
        return "n/a"
    return value.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")


def write_csv_gz(query: str, export_path: Path) -> None:
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL not set")
    with psycopg2.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            with gzip.open(export_path, "wt", newline="") as gz:
                cur.copy_expert(query, gz)


def parse_ts(value: str) -> datetime:
    if value.endswith("Z"):
        value = value.replace("Z", "+00:00")
    return datetime.fromisoformat(value)


def supabase_report(client: SupabaseRestClient) -> Tuple[int, Optional[datetime], Optional[datetime]]:
    total_rows = client.count("flow_data")
    min_row = client.fetch_first(
        "flow_data",
        {"select": "timestamp", "order": "timestamp.asc", "limit": 1},
    )
    max_row = client.fetch_first(
        "flow_data",
        {"select": "timestamp", "order": "timestamp.desc", "limit": 1},
    )
    min_ts = parse_ts(min_row["timestamp"]) if min_row else None
    max_ts = parse_ts(max_row["timestamp"]) if max_row else None
    return total_rows, min_ts, max_ts


def run_sql_analysis(run_ts: datetime) -> int:
    columns = [
        row["column_name"]
        for row in fetch_all(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'flow_data'
            ORDER BY ordinal_position;
            """
        )
    ]

    overall = fetch_one(
        """
        SELECT
            MIN(timestamp) AS min_ts,
            MAX(timestamp) AS max_ts,
            COUNT(*) AS total_rows,
            COUNT(*) FILTER (WHERE crowding_level IS NULL) AS null_crowding
        FROM flow_data;
        """
    )

    total_rows = overall["total_rows"]
    if total_rows == 0:
        report_path = REPORT_DIR / "phase1-data-quality-report.md"
        report_path.write_text(
            "# Phase 1 Data Analysis\n\n"
            f"Run date (UTC): {fmt_dt(run_ts)}\n\n"
            "No rows found in `flow_data`. Phase 1 cannot proceed until data is collected.\n"
        )
        print(f"Wrote report: {report_path}")
        return 0

    station_stats = fetch_all(
        """
        SELECT
            station_code,
            COUNT(*) AS rows,
            MIN(timestamp) AS min_ts,
            MAX(timestamp) AS max_ts,
            COUNT(DISTINCT DATE(timestamp)) AS days_with_data,
            COUNT(*) FILTER (WHERE crowding_level IS NULL) AS null_crowding
        FROM flow_data
        GROUP BY station_code
        ORDER BY station_code;
        """
    )

    coverage = fetch_all(
        """
        WITH bounds AS (SELECT MAX(timestamp) AS max_ts FROM flow_data),
        hours AS (
            SELECT station_code, date_trunc('hour', timestamp) AS hour_bucket
            FROM flow_data, bounds
            WHERE timestamp >= bounds.max_ts - interval '30 days'
        )
        SELECT
            s.code AS station_code,
            COUNT(DISTINCT h.hour_bucket) AS hours_with_data,
            30*24 AS expected_hours,
            ROUND(
                100.0 * (1 - COALESCE(COUNT(DISTINCT h.hour_bucket), 0)::float / (30*24)),
                2
            ) AS missing_pct
        FROM stations s
        LEFT JOIN hours h ON h.station_code = s.code
        GROUP BY s.code
        ORDER BY missing_pct DESC, station_code;
        """
    )

    overall_dist = fetch_all(
        """
        WITH bounds AS (SELECT MAX(timestamp) AS max_ts FROM flow_data)
        SELECT crowding_level, COUNT(*) AS count
        FROM flow_data, bounds
        WHERE timestamp >= bounds.max_ts - interval '30 days'
        GROUP BY crowding_level
        ORDER BY crowding_level;
        """
    )

    station_dist = fetch_all(
        """
        WITH bounds AS (SELECT MAX(timestamp) AS max_ts FROM flow_data),
        recent AS (
            SELECT station_code, crowding_level
            FROM flow_data, bounds
            WHERE timestamp >= bounds.max_ts - interval '30 days'
        )
        SELECT station_code, crowding_level, COUNT(*) AS count
        FROM recent
        GROUP BY station_code, crowding_level
        ORDER BY station_code, crowding_level;
        """
    )

    station_stats_map = {row["station_code"]: row for row in station_stats}
    coverage_map = {row["station_code"]: row for row in coverage}

    dist_map: Dict[str, Dict[str, int]] = {}
    for row in station_dist:
        dist_map.setdefault(row["station_code"], {})[row["crowding_level"] or "null"] = row["count"]

    total_stations = len(station_stats)
    stations_under_30 = []
    stations_missing_over_20 = []
    stations_ok = []
    for station, stats in station_stats_map.items():
        days_with_data = stats["days_with_data"] or 0
        missing_pct = coverage_map.get(station, {}).get("missing_pct", 100.0)
        if days_with_data < 30:
            stations_under_30.append((station, days_with_data))
        if missing_pct > 20:
            stations_missing_over_20.append((station, missing_pct))
        if days_with_data >= 30 and missing_pct <= 20:
            stations_ok.append(station)

    def sort_desc(items):
        return sorted(items, key=lambda x: x[1], reverse=True)

    stations_under_30 = sort_desc(stations_under_30)
    stations_missing_over_20 = sort_desc(stations_missing_over_20)

    # Top stations by high crowding share (last 30 days)
    high_share = []
    for station, counts in dist_map.items():
        total = sum(counts.values())
        if total == 0:
            continue
        high = counts.get("high", 0)
        high_share.append((station, round(100.0 * high / total, 2), total))
    high_share = sorted(high_share, key=lambda x: x[1], reverse=True)

    # Export last 30 days of flow_data (selected columns)
    export_cols = [
        col
        for col in [
            "station_code",
            "timestamp",
            "crowding_level",
            "next_train_minutes",
            "train_frequency",
            "line_code",
            "is_delay",
        ]
        if col in columns
    ]
    export_path = EXPORT_DIR / "flow_data_last_30_days.csv.gz"
    export_query = (
        "COPY ("
        "WITH bounds AS (SELECT MAX(timestamp) AS max_ts FROM flow_data) "
        f"SELECT {', '.join(export_cols)} "
        "FROM flow_data, bounds "
        "WHERE timestamp >= bounds.max_ts - interval '30 days' "
        "ORDER BY timestamp"
        ") TO STDOUT WITH CSV HEADER"
    )
    write_csv_gz(export_query, export_path)

    # Build report
    report_path = REPORT_DIR / "phase1-data-quality-report.md"
    overall_null_pct = (
        round(100.0 * overall["null_crowding"] / total_rows, 2) if total_rows else 0.0
    )

    overall_dist_map = {row["crowding_level"] or "null": row["count"] for row in overall_dist}

    lines = []
    lines.append("# Phase 1 Data Analysis\n")
    lines.append(f"Run date (UTC): {fmt_dt(run_ts)}\n")
    lines.append("## Dataset Overview\n")
    lines.append(f"- Total rows: {total_rows}\n")
    lines.append(f"- Date range: {fmt_dt(overall['min_ts'])} → {fmt_dt(overall['max_ts'])}\n")
    lines.append(f"- Distinct stations (flow_data): {total_stations}\n")
    lines.append(
        f"- Null `crowding_level`: {overall['null_crowding']} ({overall_null_pct}%)\n"
    )
    lines.append(f"- Columns in `flow_data`: {', '.join(columns)}\n")

    lines.append("## 30-Day Coverage (Hourly Buckets)\n")
    lines.append(
        f"- Window: {fmt_dt(overall['max_ts'])} minus 30 days\n"
    )
    lines.append(f"- Stations meeting ≥30 days data AND ≤20% missing: {len(stations_ok)}\n")
    lines.append(
        f"- Stations <30 days of data: {len(stations_under_30)}\n"
    )
    if stations_under_30:
        lines.append("\nTop stations with <30 days (by days with data):\n")
        lines.append("| Station | Days with data |\n|---|---|\n")
        for station, days in stations_under_30[:10]:
            lines.append(f"| {station} | {days} |\n")
    lines.append(
        f"\n- Stations with >20% missing hours: {len(stations_missing_over_20)}\n"
    )
    if stations_missing_over_20:
        lines.append("\nTop stations by missing % (last 30 days):\n")
        lines.append("| Station | Missing % |\n|---|---|\n")
        for station, pct in stations_missing_over_20[:10]:
            lines.append(f"| {station} | {pct} |\n")

    lines.append("\n## Crowding Distribution (Last 30 Days)\n")
    lines.append("| Level | Count |\n|---|---|\n")
    for level in ["low", "medium", "high", "null"]:
        if level in overall_dist_map:
            lines.append(f"| {level} | {overall_dist_map[level]} |\n")

    lines.append("\nTop stations by `high` crowding share (last 30 days):\n")
    lines.append("| Station | High % | Samples |\n|---|---|\n")
    for station, pct, total in high_share[:10]:
        lines.append(f"| {station} | {pct} | {total} |\n")

    lines.append("\n## Export\n")
    lines.append(
        f"- Exported last 30 days to `{export_path.relative_to(ROOT)}` "
        f"(columns: {', '.join(export_cols)})\n"
    )

    report_path.write_text("".join(lines))
    print(f"Wrote report: {report_path}")
    return 0


def run_supabase_analysis(run_ts: datetime, client: SupabaseRestClient) -> int:
    total_rows, min_ts, max_ts = supabase_report(client)
    null_crowding = client.count("flow_data", {"crowding_level": "is.null"})

    if total_rows == 0 or not max_ts:
        report_path = REPORT_DIR / "phase1-data-quality-report.md"
        report_path.write_text(
            "# Phase 1 Data Analysis\n\n"
            f"Run date (UTC): {fmt_dt(run_ts)}\n\n"
            "No rows found in `flow_data`. Phase 1 cannot proceed until data is collected.\n"
        )
        print(f"Wrote report: {report_path}")
        return 0

    stations = client.fetch_all(
        "stations",
        {"select": "code", "order": "code.asc"},
        page_size=1000,
    )
    station_codes = [row["code"] for row in stations if row.get("code")]

    window_start = max_ts - timedelta(days=30)
    window_start_str = window_start.isoformat()

    desired_cols = [
        "station_code",
        "timestamp",
        "crowding_level",
        "next_train_minutes",
        "train_frequency",
        "line_code",
        "is_delay",
    ]

    export_path = EXPORT_DIR / "flow_data_last_30_days.csv.gz"
    export_cols: Optional[List[str]] = None
    fields_set: set[str] = set()

    station_days: Dict[str, set] = {code: set() for code in station_codes}
    station_hours: Dict[str, set] = {code: set() for code in station_codes}
    station_dist: Dict[str, Dict[str, int]] = {
        code: {"low": 0, "medium": 0, "high": 0, "null": 0} for code in station_codes
    }
    station_rows: Dict[str, int] = {code: 0 for code in station_codes}
    station_null: Dict[str, int] = {code: 0 for code in station_codes}

    overall_dist: Dict[str, int] = {"low": 0, "medium": 0, "high": 0, "null": 0}

    def ensure_station(code: str) -> None:
        if code not in station_days:
            station_days[code] = set()
            station_hours[code] = set()
            station_dist[code] = {"low": 0, "medium": 0, "high": 0, "null": 0}
            station_rows[code] = 0
            station_null[code] = 0

    window_count = client.count("flow_data", {"timestamp": f"gte.{window_start_str}"})

    with gzip.open(export_path, "wt", newline="") as gz:
        writer = csv.writer(gz)

        offset = 0
        page_size = 1000
        while offset < window_count:
            params = {
                "select": "*",
                "order": "timestamp.asc",
                "timestamp": f"gte.{window_start_str}",
                "limit": page_size,
                "offset": offset,
            }
            response = client.get("flow_data", params=params)
            page = response.json()
            if not page:
                break

            for row in page:
                fields_set.update(row.keys())
                if export_cols is None:
                    export_cols = [c for c in desired_cols if c in row] or sorted(row.keys())
                    writer.writerow(export_cols)

                if export_cols:
                    writer.writerow([row.get(col, "") for col in export_cols])

                station_code = row.get("station_code")
                if not station_code:
                    continue
                ensure_station(station_code)
                station_rows[station_code] += 1

                level = row.get("crowding_level") or "null"
                if level not in overall_dist:
                    level = "null"
                overall_dist[level] += 1
                station_dist[station_code][level] += 1
                if level == "null":
                    station_null[station_code] += 1

                ts_val = row.get("timestamp")
                if not ts_val:
                    continue
                ts = parse_ts(ts_val)
                station_days[station_code].add(ts.date())
                station_hours[station_code].add(ts.replace(minute=0, second=0, microsecond=0))

            offset += len(page)

        if export_cols is None:
            export_cols = desired_cols
            writer.writerow(export_cols)

    if not station_codes:
        station_codes = list(station_days.keys())

    total_stations = len(station_codes)
    expected_hours = 30 * 24

    stations_under_30 = []
    stations_missing_over_20 = []
    stations_ok = []
    for station in station_codes:
        days_with_data = len(station_days.get(station, set()))
        hours_with_data = len(station_hours.get(station, set()))
        missing_pct = round(100.0 * (1 - (hours_with_data / expected_hours)), 2)
        if days_with_data < 30:
            stations_under_30.append((station, days_with_data))
        if missing_pct > 20:
            stations_missing_over_20.append((station, missing_pct))
        if days_with_data >= 30 and missing_pct <= 20:
            stations_ok.append(station)

    def sort_desc(items):
        return sorted(items, key=lambda x: x[1], reverse=True)

    stations_under_30 = sort_desc(stations_under_30)
    stations_missing_over_20 = sort_desc(stations_missing_over_20)

    high_share = []
    for station, counts in station_dist.items():
        total = sum(counts.values())
        if total == 0:
            continue
        high = counts.get("high", 0)
        high_share.append((station, round(100.0 * high / total, 2), total))
    high_share = sorted(high_share, key=lambda x: x[1], reverse=True)

    columns = sorted(fields_set) if fields_set else desired_cols

    report_path = REPORT_DIR / "phase1-data-quality-report.md"
    overall_null_pct = round(100.0 * null_crowding / total_rows, 2) if total_rows else 0.0

    lines = []
    lines.append("# Phase 1 Data Analysis\n")
    lines.append(f"Run date (UTC): {fmt_dt(run_ts)}\n")
    lines.append("## Dataset Overview\n")
    lines.append(f"- Total rows: {total_rows}\n")
    lines.append(f"- Date range: {fmt_dt(min_ts)} → {fmt_dt(max_ts)}\n")
    lines.append(f"- Distinct stations (stations table): {total_stations}\n")
    lines.append(
        f"- Null `crowding_level`: {null_crowding} ({overall_null_pct}%)\n"
    )
    lines.append(f"- Columns in `flow_data`: {', '.join(columns)}\n")

    lines.append("## 30-Day Coverage (Hourly Buckets)\n")
    lines.append(f"- Window: {fmt_dt(max_ts)} minus 30 days\n")
    lines.append(f"- Stations meeting ≥30 days data AND ≤20% missing: {len(stations_ok)}\n")
    lines.append(f"- Stations <30 days of data: {len(stations_under_30)}\n")
    if stations_under_30:
        lines.append("\nTop stations with <30 days (by days with data):\n")
        lines.append("| Station | Days with data |\n|---|---|\n")
        for station, days in stations_under_30[:10]:
            lines.append(f"| {station} | {days} |\n")
    lines.append(f"\n- Stations with >20% missing hours: {len(stations_missing_over_20)}\n")
    if stations_missing_over_20:
        lines.append("\nTop stations by missing % (last 30 days):\n")
        lines.append("| Station | Missing % |\n|---|---|\n")
        for station, pct in stations_missing_over_20[:10]:
            lines.append(f"| {station} | {pct} |\n")

    lines.append("\n## Crowding Distribution (Last 30 Days)\n")
    lines.append("| Level | Count |\n|---|---|\n")
    for level in ["low", "medium", "high", "null"]:
        if level in overall_dist:
            lines.append(f"| {level} | {overall_dist[level]} |\n")

    lines.append("\nTop stations by `high` crowding share (last 30 days):\n")
    lines.append("| Station | High % | Samples |\n|---|---|\n")
    for station, pct, total in high_share[:10]:
        lines.append(f"| {station} | {pct} | {total} |\n")

    lines.append("\n## Export\n")
    lines.append(
        f"- Exported last 30 days to `{export_path.relative_to(ROOT)}` "
        f"(columns: {', '.join(export_cols or desired_cols)})\n"
    )

    report_path.write_text("".join(lines))
    print(f"Wrote report: {report_path}")
    return 0


def main() -> int:
    run_ts = datetime.now(timezone.utc)

    use_db = False
    if engine:
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            use_db = True
        except Exception:
            use_db = False

    if use_db:
        return run_sql_analysis(run_ts)

    key = SUPABASE_SERVICE_ROLE_KEY or SUPABASE_PUBLISHABLE_KEY
    if not SUPABASE_URL or not key:
        raise SystemExit("No DB connection and no Supabase credentials available.")

    client = SupabaseRestClient(SUPABASE_URL, key)
    return run_supabase_analysis(run_ts, client)


if __name__ == "__main__":
    raise SystemExit(main())
