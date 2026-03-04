#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Building ProjectFlow API Docker image...${NC}"

# Build with buildkit for better caching
DOCKER_BUILDKIT=1 docker build \
  -t projectflow-api:latest \
  -t projectflow-api:$(date +%Y%m%d-%H%M%S) \
  --progress=plain \
  .

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Build successful!${NC}"
  echo -e "${BLUE}Image sizes:${NC}"
  docker images projectflow-api --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
else
  echo "Build failed!"
  exit 1
fi