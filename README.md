# MTR Flow Analytics

> Real-time MTR station crowding analysis and predictive analytics dashboard

A comprehensive system for monitoring and predicting crowd levels across Hong Kong's MTR (Mass Transit Railway) network, combining real-time data collection, machine learning predictions, and an interactive visualization dashboard.

## Features

- **Real-Time Monitoring**: Live tracking of train arrivals and station crowding levels
- **24-Hour Predictions**: ML-powered forecasting of crowding patterns *(in progress)*
- **Interactive Map**: Visualize the entire MTR network with real-time status updates
- **Station Analytics**: Detailed crowding trends and historical data for each station
- **Automated Data Collection**: n8n workflows for continuous data ingestion
- **Multi-Line Support**: Coverage across all major MTR lines

## Tech Stack

### Frontend
- **Next.js 14** (App Router) - React framework with server-side rendering
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Query** - Data fetching and caching
- **shadcn/ui** - Component library

### Backend
- **FastAPI** - High-performance Python API framework
- **PostgreSQL** (Supabase) - Primary database
- **SQLAlchemy** - ORM and database management
- **Pydantic** - Data validation and serialization
- **scikit-learn** - Machine learning models *(in progress)*

### Data & Automation
- **n8n** - Workflow automation for data collection
- **MTR Real-Time API** - Official government transport data
- **Traffic Data API** - External traffic conditions

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client Layer                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Next.js Frontend (Port 3000)                            │   │
│  │  - Dashboard, Map, Station Details, Predictions         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────────┐
│                       Application Layer                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  FastAPI Backend (Port 8000)                             │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ Routers                                            │  │   │
│  │  │  - /api/stations     - Station information        │  │   │
│  │  │  - /api/flow-data    - Real-time crowding data    │  │   │
│  │  │  - /api/predictions  - ML predictions             │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ ML Engine (in progress)                            │  │   │
│  │  │  - Random Forest Classifier                        │  │   │
│  │  │  - Features: hour, day_of_week, is_holiday, etc.  │  │   │
│  │  │  - Predictions: low/medium/high crowding          │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕ SQL
┌─────────────────────────────────────────────────────────────────┐
│                         Data Layer                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  PostgreSQL (Supabase)                                   │   │
│  │  - stations          - Station metadata                 │   │
│  │  - flow_data         - Time-series crowding data        │   │
│  │  - predictions       - ML forecast results              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↑ HTTP
┌─────────────────────────────────────────────────────────────────┐
│                      Data Collection Layer                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  n8n Workflows (Automated)                               │   │
│  │  - MTR_Flow_Collection  - Fetch train schedules         │   │
│  │  - MTR_Flow_Cleanup     - Data cleaning & storage       │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  External Data Sources                                   │   │
│  │  - MTR RT API          - Real-time train arrivals       │   │
│  │  - Traffic API         - Road traffic conditions        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
mtr-flow-analytics/
├── frontend/                    # Next.js application
│   ├── app/                     # App router pages
│   │   ├── page.tsx            # Dashboard home
│   │   ├── map/                # System map view
│   │   ├── predictions/        # Predictions view
│   │   └── station/[code]/     # Station detail pages
│   ├── components/              # React components
│   │   ├── dashboard/          # Dashboard widgets
│   │   ├── map/                # Map components
│   │   ├── station/            # Station cards
│   │   └── ui/                 # shadcn/ui components
│   ├── lib/                    # Utilities and helpers
│   │   ├── api.ts             # API client
│   │   └── data.ts            # Data transformations
│   └── hooks/                  # Custom React hooks
│
├── backend/                     # FastAPI application
│   ├── app/
│   │   ├── main.py            # Application entry point
│   │   ├── routers/           # API route handlers
│   │   │   ├── stations.py
│   │   │   ├── flow_data.py
│   │   │   └── predictions.py
│   │   ├── ml/                # ML logic (in progress)
│   │   │   ├── crowding.py    # Crowding prediction model
│   │   │   ├── mtr_api.py     # MTR API client
│   │   │   └── external_data.py
│   │   └── db/                # Database setup
│   │       └── database.py
│   ├── requirements.txt       # Python dependencies
│   └── Dockerfile            # Container configuration
│
└── n8n/                        # Automation workflows
    ├── MTR_Flow_Collection.json    # Data collection workflow
    └── MTR_Flow_Cleanup.json       # Data cleaning workflow
```

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **PostgreSQL** database (or Supabase account)
- **n8n** instance (optional, for automated data collection)

### Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with your backend API URL
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database credentials
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

### Environment Variables

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend (.env)**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/mtr_flow
MTR_API_BASE_URL=https://rt.data.gov.hk/v2/transport/mtr
TRAFFIC_API_URL=https://resource.data.one.gov.hk/td/speedmap.xml
```

## API Endpoints

### Stations
- `GET /api/stations` - List all MTR stations
- `GET /api/stations/{code}` - Get station details
- `GET /api/stations/{code}/lines` - Get lines serving a station

### Flow Data
- `GET /api/flow-data` - Get real-time crowding data
- `GET /api/flow-data/station/{code}` - Station-specific data
- `GET /api/flow-data/line/{line}` - Line-specific data

### Predictions *(in progress)*
- `GET /api/predictions/{station_code}` - Get 24h crowding forecast
- `GET /api/predictions/hourly` - Hourly predictions for all stations

## Data Schema

### Stations
- `station_code` - Unique station identifier (e.g., "CEN", "TST")
- `name_en` - English name
- `name_zh` - Chinese name
- `lines` - Array of serving lines

### Flow Data
- `timestamp` - Data collection time
- `station_code` - Station reference
- `next_train_minutes` - Minutes until next train
- `crowding_level` - Current crowding (low/medium/high)

### Predictions *(schema in development)*
- `station_code` - Station reference
- `predicted_hour` - Hour of prediction
- `crowding_level` - Predicted crowding
- `confidence` - Model confidence score

## Development

### Frontend Development
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript checks
```

### Backend Development
```bash
uvicorn app.main:app --reload    # Development server
pytest tests/                     # Run tests
python -m app.main               # Run directly
```

### Code Style
- **Frontend**: kebab-case for files, camelCase for variables
- **Backend**: snake_case for files and variables
- **API**: RESTful conventions with plural resource names

## Deployment

### Frontend
**Platform**: Vercel
**Build Command**: `npm run build`
**Output Directory**: `.next`

### Backend
**Platform**: Railway
**Runtime**: Python 3.11+
**Build**: Docker (Dockerfile included)

### Database
**Platform**: Supabase
**Database**: PostgreSQL 15+

## Machine Learning

The ML prediction system is currently **in progress**. The planned implementation includes:

- **Model**: Random Forest Classifier
- **Features**:
  - `hour` - Hour of day (0-23)
  - `day_of_week` - Day of week (0-6)
  - `is_holiday` - Boolean holiday flag
  - `is_rush_hour` - Peak hours (7-9am, 5-7pm)
  - `prev_hour_crowding` - Previous hour's crowding level
- **Target**: `crowding_level` (low, medium, high)
- **Training**: Automated retraining with new data
- **Accuracy Goal**: 85%+ prediction accuracy

## n8n Workflows

### MTR_Flow_Collection
- **Trigger**: Every 2 minutes
- **Actions**:
  1. Fetch train schedules from MTR API
  2. Calculate next train arrival times
  3. Estimate crowding based on frequency
  4. Store in database

### MTR_Flow_Cleanup
- **Trigger**: Daily at 2:00 AM
- **Actions**:
  1. Remove duplicate entries
  2. Archive old data (>90 days)
  3. Optimize database indexes

## Contributing

This is a private project. For questions or collaboration inquiries, please contact the maintainer.

## License

Proprietary - All rights reserved

## Data Sources

- [Hong Kong Transport Department Real-Time API](https://data.gov.hk/en-data/dataset/hk-td-tis_21-traffic-speed-map)
- [MTR Real-Time Train Schedule API](https://data.gov.hk/en-data/dataset/mtr-data2-nexttrain-data)

---

**Status**: Active Development
**Target Completion**: February 24, 2025
**Maintainer**: Ryan Wiguna ([@Triangulr](https://github.com/Triangulr))
