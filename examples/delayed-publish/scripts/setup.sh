#!/bin/bash

# Hoppity Delayed Publish Example Setup Script
# This script helps set up the delayed-publish example

set -e

echo "🚀 Setting up Hoppity Delayed Publish Example..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created. You can edit it to customize settings."
else
    echo "✅ .env file already exists."
fi

# Check if RabbitMQ is running
echo "🔍 Checking RabbitMQ connection..."
if curl -s http://localhost:15672/api/overview > /dev/null 2>&1; then
    echo "✅ RabbitMQ is running and accessible."
else
    echo "⚠️  RabbitMQ is not running or not accessible."
    echo "   Please start RabbitMQ before running the example."
    echo "   Options:"
    echo "   - Install locally: brew install rabbitmq && brew services start rabbitmq"
    echo "   - Use Docker: docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management"
    echo "   - Management UI: http://localhost:15672 (guest/guest)"
fi

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
    echo "✅ Dependencies installed."
else
    echo "✅ Dependencies already installed."
fi

echo ""
echo "🎯 Setup complete! You can now run the example:"
echo ""
echo "  # Start both services with hot reloading"
echo "  pnpm dev:both"
echo ""
echo "  # Or start services individually"
echo "  pnpm dev:service-a  # In one terminal"
echo "  pnpm dev:service-b  # In another terminal"
echo ""
echo "📊 Monitor the system:"
echo "  - RabbitMQ Management: http://localhost:15672 (guest/guest)"
echo "  - Service logs: Check terminal output"
echo ""
echo "📚 For more information, see README.md" 