#!/bin/bash

# Health check script for Docker container
# This script checks if the application is running properly

set -e

# Wait for the application to start
echo "Waiting for application to start..."
sleep 10

# Check if the application is responding
echo "Checking application health..."
curl -f http://localhost:3000/api/health || exit 1

echo "Application is healthy!"
exit 0
