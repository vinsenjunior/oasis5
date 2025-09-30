#!/bin/bash

# Docker PostgreSQL Setup Script for Inventory Booking App

echo "🐳 Setting up PostgreSQL with Docker for Inventory Booking App..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "🔄 Starting PostgreSQL container..."

# Start Docker Compose
docker-compose up -d

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Update .env file
echo "📝 Updating .env file..."
cat > .env << EOF
DATABASE_URL="postgresql://inventory_user:inventory_password_123@localhost:5432/inventory_booking"
EOF

echo "✅ .env file updated!"

# Test connection
echo "🔍 Testing database connection..."
if npm run db:migrate > /dev/null 2>&1; then
    echo "✅ Database connection successful!"
    
    # Seed the database
    echo "🌱 Seeding database..."
    npm run db:seed
    echo "✅ Database seeded successfully!"
    
    echo "🎉 Docker PostgreSQL setup completed successfully!"
    echo ""
    echo "📊 Database Management:"
    echo "- PostgreSQL: localhost:5432"
    echo "- pgAdmin: http://localhost:8080"
    echo "- pgAdmin Email: admin@example.com"
    echo "- pgAdmin Password: admin123"
    echo ""
    echo "You can now run the application with: npm run dev"
else
    echo "❌ Database connection failed. Please check Docker container status."
    echo "Run: docker-compose logs"
fi