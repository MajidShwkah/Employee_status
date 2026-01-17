#!/bin/bash

# Local Server Startup Script for Office Dashboard
# This script builds and starts a local HTTP server

echo "🏗️  Building dashboard..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"
echo ""
echo "🌐 Starting local server..."
echo ""

# Get local IP address
IP=$(hostname -I | awk '{print $1}')

echo "📱 Access the dashboard at:"
echo "   http://localhost:8080"
echo "   http://$IP:8080 (from other devices on network)"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Check if http-server is installed
if ! command -v http-server &> /dev/null; then
    echo "📦 Installing http-server..."
    npm install -g http-server
fi

# Start server
cd dist
http-server -p 8080 -o
