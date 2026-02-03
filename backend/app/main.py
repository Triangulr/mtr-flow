from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import stations, flow_data, predictions, training_flow_data

app = FastAPI(title="MTR Flow Analytics API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "https://mtr-api.axs.ink",  # Production API domain
        "*"  # Allow all origins for production API
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(stations.router, prefix="/api/stations", tags=["stations"])
app.include_router(flow_data.router, prefix="/api/flow", tags=["flow"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["predictions"])
app.include_router(
    training_flow_data.router, prefix="/api/training-flow", tags=["training-flow"]
)

@app.get("/")
async def root():
    return {"message": "MTR Flow Analytics API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
