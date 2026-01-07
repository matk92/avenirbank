#!/bin/bash

# Production deployment script for AVENIR Bank
# This script builds and deploys the application using Docker Compose

set -e

echo "🏦 AVENIR Bank - Production Deployment Script"
echo "=============================================="

# Check if .env.prod exists
if [ ! -f .env.prod ]; then
    echo "❌ Error: .env.prod file not found!"
    echo "Please copy .env.prod.example to .env.prod and fill in the values."
    exit 1
fi

# Load environment variables
export $(cat .env.prod | grep -v '^#' | xargs)

echo "📋 Pre-deployment checks..."

# Check Docker and Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed!"
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Create necessary directories
echo "📁 Creating required directories..."
mkdir -p nginx/ssl
mkdir -p postgres/init
mkdir -p monitoring
mkdir -p redis

echo "🔧 Building production images..."

# Build production images
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🗄️ Setting up database..."

# Start only database services first
docker-compose -f docker-compose.prod.yml up -d postgres redis

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

echo "🚀 Starting all services..."

# Start all services
docker-compose -f docker-compose.prod.yml up -d

echo "⏳ Waiting for services to be ready..."
sleep 15

# Health checks
echo "🏥 Performing health checks..."

# Check if services are running
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "✅ Services are running"
else
    echo "❌ Some services failed to start"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

# Test endpoints
echo "🔍 Testing endpoints..."

# Test Nginx
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Nginx is responding"
else
    echo "⚠️ Nginx health check failed"
fi

# Test Backend API
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    echo "✅ Backend API is responding"
else
    echo "⚠️ Backend API health check failed"
fi

echo "🎉 Deployment completed!"
echo ""
echo "📊 Service URLs:"
echo "  - Application: http://localhost"
echo "  - API: http://localhost/api"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3001"
echo ""
echo "📋 Useful commands:"
echo "  - View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  - Stop services: docker-compose -f docker-compose.prod.yml down"
echo "  - Restart services: docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "🔐 Don't forget to:"
echo "  - Configure SSL certificates in nginx/ssl/"
echo "  - Set up Cloudflare tunnel if using"
echo "  - Configure monitoring alerts"
