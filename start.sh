#!/bin/bash

# OpenShelf Quick Start Script
# This script helps you get OpenShelf running quickly

set -e

echo "🚀 OpenShelf Quick Start"
echo "========================"
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the openshelf root directory"
    exit 1
fi

echo "Choose your setup method:"
echo "1) Docker (Recommended - Easy & Fast)"
echo "2) Local Development (Node.js required)"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "🐳 Starting Docker setup..."
    echo ""
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker is not installed. Please install Docker first:"
        echo "   https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose is not installed. Please install Docker Compose first:"
        echo "   https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # Copy env file if it doesn't exist
    if [ ! -f ".env" ]; then
        echo "📝 Creating .env file..."
        cp .env.example .env
        echo "✅ .env file created (please update JWT_SECRET for production!)"
    fi
    
    echo "🏗️  Building and starting containers..."
    docker-compose up -d --build
    
    echo ""
    echo "✅ OpenShelf is starting up!"
    echo ""
    echo "📱 Access the application at:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:3001"
    echo ""
    echo "🔑 Default login credentials:"
    echo "   Username: admin"
    echo "   Password: admin"
    echo "   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!"
    echo ""
    echo "📊 View logs with: docker-compose logs -f"
    echo "🛑 Stop with: docker-compose down"
    echo ""
    
elif [ "$choice" = "2" ]; then
    echo ""
    echo "💻 Starting local development setup..."
    echo ""
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js 20+ first:"
        echo "   https://nodejs.org/"
        exit 1
    fi
    
    # Check Node version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo "⚠️  Warning: Node.js version 18+ is recommended (you have: $(node -v))"
    fi
    
    # Backend setup
    echo "📦 Setting up backend..."
    cd backend
    
    if [ ! -f ".env" ]; then
        cp .env.example .env
        echo "✅ Backend .env created"
    fi
    
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing backend dependencies..."
        npm install
    fi
    
    if [ ! -f "database/openshelf.db" ]; then
        echo "🗄️  Initializing database..."
        npm run init-db
    fi
    
    cd ..
    
    # Frontend setup
    echo "📦 Setting up frontend..."
    cd frontend
    
    if [ ! -f ".env" ]; then
        cp .env.example .env
        echo "✅ Frontend .env created"
    fi
    
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing frontend dependencies..."
        npm install
    fi
    
    cd ..
    
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "To start the application:"
    echo ""
    echo "Terminal 1 (Backend):"
    echo "  cd backend && npm run dev"
    echo ""
    echo "Terminal 2 (Frontend):"
    echo "  cd frontend && npm run dev"
    echo ""
    echo "Then access:"
    echo "  Frontend: http://localhost:5173"
    echo "  Backend:  http://localhost:3001"
    echo ""
    echo "🔑 Default login: admin / admin"
    echo "   ⚠️  Change this password immediately!"
    echo ""
    
else
    echo "❌ Invalid choice. Please run the script again."
    exit 1
fi

echo "📚 For more information, see:"
echo "   - SETUP.md for detailed setup instructions"
echo "   - DEVELOPMENT.md for development notes"
echo "   - README.md for general information"
echo ""
echo "Happy collecting! 🎉"
