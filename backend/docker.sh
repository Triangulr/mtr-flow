#!/bin/bash

# Configuration
IMAGE_NAME="axesys/mtr-backend"
TAG="latest"

# Check if docker buildx is available
if ! docker buildx version > /dev/null 2>&1; then
    echo "Error: 'docker buildx' is not available. Please install Docker Desktop or setup buildx."
    exit 1
fi

echo "🚀 Building and pushing image for $IMAGE_NAME:$TAG..."
echo "Target platform: linux/amd64"

# Create a new builder instance if one doesn't exist (optional but good for isolation)
# docker buildx create --use --name mtr-builder || docker buildx use mtr-builder

# Build and push
docker buildx build \
  --platform linux/amd64 \
  --tag "$IMAGE_NAME:$TAG" \
  --push \
  .

echo ""
echo "✅ Build complete and pushed to Docker Hub!"
echo "Now you can go to Portainer and click 'Pull and redeploy' on your stack."
