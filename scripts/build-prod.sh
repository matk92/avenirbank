#!/bin/bash

# Fast production build script with Docker layer caching
# This script builds images efficiently by leveraging Docker's cache

set -e

echo "🏗️ Building AVENIR Bank production images..."

# Build backend first (usually faster)
echo "📦 Building backend image..."
docker build \
  -f backend/Dockerfile.prod \
  -t avenirbank-backend:latest \
  --cache-from avenirbank-backend:latest \
  backend/

echo "✅ Backend built successfully"

# Build frontend
echo "📦 Building frontend image..."
docker build \
  -f Dockerfile.frontend.prod \
  -t avenirbank-frontend:latest \
  --cache-from avenirbank-frontend:latest \
  .

echo "✅ Frontend built successfully"

echo "🎉 All images built successfully!"
echo ""
echo "Next steps:"
echo "  1. docker-compose -f docker-compose.prod.yml up -d"
echo "  2. Check logs: docker-compose -f docker-compose.prod.yml logs -f"
