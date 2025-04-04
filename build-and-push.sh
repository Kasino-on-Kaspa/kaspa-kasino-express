#!/bin/bash

# Exit on error
set -e

# Image name and tag
IMAGE_NAME="ghcr.io/kasino-on-kaspa/kasino-backend"
TAG="latest"

# Ensure buildx is available and create a new builder instance
docker buildx create --name multiarch-builder --use || true

# Build and push for both platforms
echo "Building and pushing multi-platform image..."
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag "${IMAGE_NAME}:${TAG}" \
  --push \
  .

echo "Successfully built and pushed ${IMAGE_NAME}:${TAG}"

# Clean up
docker buildx rm multiarch-builder 