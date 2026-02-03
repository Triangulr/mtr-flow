#!/bin/bash

# MTR Flow Analytics - Google Cloud Run Deployment Script
# This script builds, pushes to Artifact Registry, and deploys to Cloud Run

set -e  # Exit on any error

# ============================================================================
# CONFIGURATION - Update these values for your project
# ============================================================================

PROJECT_ID="letum-prod"                     # Your GCP project ID
REGION="asia-east1"                         # Cloud Run region (Hong Kong for MTR data)
SERVICE_NAME="mtr-flow-api"                 # Cloud Run service name
REPOSITORY="mtr-backend"                    # Artifact Registry repository name
IMAGE_NAME="backend"                        # Docker image name

# ============================================================================
# ENVIRONMENT VARIABLES - Load from .env file
# ============================================================================

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Warning: .env file not found. Make sure environment variables are set."
fi

# ============================================================================
# SCRIPT START
# ============================================================================

echo "========================================="
echo "MTR Flow Analytics - GCP Deployment"
echo "========================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    exit 1
fi

# Set the active project
echo "Setting GCP project to: $PROJECT_ID"
gcloud config set project "$PROJECT_ID"

# Build the image URL
IMAGE_TAG=$(date +%Y%m%d-%H%M%S)  # Timestamp tag
IMAGE_URL="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$IMAGE_NAME:$IMAGE_TAG"
LATEST_URL="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$IMAGE_NAME:latest"

echo ""
echo "Configuration:"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Service: $SERVICE_NAME"
echo "  Image: $IMAGE_URL"
echo ""

# Confirm before proceeding
read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

# ============================================================================
# STEP 1: Create Artifact Registry repository (if it doesn't exist)
# ============================================================================

echo ""
echo "Step 1: Checking Artifact Registry repository..."

if ! gcloud artifacts repositories describe "$REPOSITORY" \
    --location="$REGION" &> /dev/null; then
    echo "Creating Artifact Registry repository: $REPOSITORY"
    gcloud artifacts repositories create "$REPOSITORY" \
        --repository-format=docker \
        --location="$REGION" \
        --description="MTR Flow Analytics container images"
else
    echo "Repository already exists: $REPOSITORY"
fi

# ============================================================================
# STEP 2: Configure Docker authentication
# ============================================================================

echo ""
echo "Step 2: Configuring Docker authentication..."
gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet

# ============================================================================
# STEP 3: Build Docker image (for linux/amd64 platform)
# ============================================================================

echo ""
echo "Step 3: Building Docker image for Cloud Run (linux/amd64)..."
docker build --platform linux/amd64 -t "$IMAGE_URL" -t "$LATEST_URL" .

# ============================================================================
# STEP 4: Push to Artifact Registry
# ============================================================================

echo ""
echo "Step 4: Pushing to Artifact Registry..."
docker push "$IMAGE_URL"
docker push "$LATEST_URL"

# ============================================================================
# STEP 5: Deploy to Cloud Run
# ============================================================================

echo ""
echo "Step 5: Deploying to Cloud Run..."

# Build the environment variables from .env file
ENV_VARS=""
if [ ! -z "$DATABASE_URL" ]; then
    ENV_VARS="$ENV_VARS,DATABASE_URL=$DATABASE_URL"
fi
if [ ! -z "$API_HOST" ]; then
    ENV_VARS="$ENV_VARS,API_HOST=$API_HOST"
fi
if [ ! -z "$API_PORT" ]; then
    ENV_VARS="$ENV_VARS,API_PORT=$API_PORT"
fi
if [ ! -z "$MTR_API_BASE_URL" ]; then
    ENV_VARS="$ENV_VARS,MTR_API_BASE_URL=$MTR_API_BASE_URL"
fi
if [ ! -z "$TRAFFIC_API_URL" ]; then
    ENV_VARS="$ENV_VARS,TRAFFIC_API_URL=$TRAFFIC_API_URL"
fi
if [ ! -z "$SUPABASE_URL" ]; then
    ENV_VARS="$ENV_VARS,SUPABASE_URL=$SUPABASE_URL"
fi
if [ ! -z "$SUPABASE_PUBLISHABLE_KEY" ]; then
    ENV_VARS="$ENV_VARS,SUPABASE_PUBLISHABLE_KEY=$SUPABASE_PUBLISHABLE_KEY"
fi
# Remove leading comma if present
ENV_VARS="${ENV_VARS#,}"

# Deploy to Cloud Run
DEPLOY_CMD="gcloud run deploy $SERVICE_NAME \
    --image=$IMAGE_URL \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --port=8000 \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=1 \
    --max-instances=10"

# Add environment variables if any are set
if [ ! -z "$ENV_VARS" ]; then
    DEPLOY_CMD="$DEPLOY_CMD --set-env-vars=$ENV_VARS"
fi

eval $DEPLOY_CMD

# ============================================================================
# STEP 6: Get the service URL
# ============================================================================

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="

SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --region="$REGION" \
    --format="value(status.url)")

echo ""
echo "Your API is now live at:"
echo "  $SERVICE_URL"
echo ""
echo "Test endpoints:"
echo "  curl $SERVICE_URL/"
echo "  curl $SERVICE_URL/health"
echo ""
echo "View logs:"
echo "  gcloud run services logs read $SERVICE_NAME --region=$REGION"
echo ""
echo "Update frontend NEXT_PUBLIC_API_URL to: $SERVICE_URL"
echo ""
