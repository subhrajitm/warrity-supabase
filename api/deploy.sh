#!/bin/bash

# Script to deploy the Warrity API to production
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production

set -e

ENVIRONMENT=${1:-production}
SERVER_HOST=${2:-api.warrity.com}

echo "🚀 Deploying Warrity API to $ENVIRONMENT environment on $SERVER_HOST"

# Make sure the script is executable
chmod +x server-control.sh

# Source environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
  source ".env.$ENVIRONMENT"
  echo "✅ Loaded environment variables from .env.$ENVIRONMENT"
else
  echo "⚠️ Warning: .env.$ENVIRONMENT file not found. Using existing environment variables."
fi

# Stop any running containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

# Pull the latest code
echo "⬇️ Pulling latest code..."
git pull origin main

# Build and start the containers in detached mode
echo "🏗️ Building and starting containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# Check if containers are running
echo "🔍 Checking container status..."
docker ps | grep "warrity-api"

echo "🔍 Checking Nginx status..."
docker ps | grep "nginx"

# Display logs
echo "📋 Recent logs:"
docker-compose -f docker-compose.prod.yml logs --tail=20

echo "✅ Deployment completed successfully!"
echo "🌐 API should be accessible at https://$SERVER_HOST"
echo ""
echo "To view logs, run: docker-compose -f docker-compose.prod.yml logs -f"
echo "To stop the service, run: docker-compose -f docker-compose.prod.yml down" 