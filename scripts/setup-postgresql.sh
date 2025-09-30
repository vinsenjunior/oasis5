#!/bin/bash

# PostgreSQL Setup Script for Inventory Booking App

echo "🚀 Setting up PostgreSQL for Inventory Booking App..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    echo "Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    echo "macOS: brew install postgresql"
    echo "Windows: Download from https://www.postgresql.org/download/windows/"
    exit 1
fi

# Check if PostgreSQL service is running
if ! sudo systemctl is-active --quiet postgresql; then
    echo "🔄 Starting PostgreSQL service..."
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Database configuration
DB_NAME="inventory_booking"
DB_USER="inventory_user"
DB_PASSWORD="inventory_password_123"

echo "📊 Creating database and user..."

# Create database
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database $DB_NAME already exists"

# Create user
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "User $DB_USER already exists"

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;"

echo "✅ Database setup completed!"

# Update .env file
echo "📝 Updating .env file..."
cat > .env << EOF
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
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
    
    echo "🎉 PostgreSQL setup completed successfully!"
    echo "You can now run the application with: npm run dev"
else
    echo "❌ Database connection failed. Please check your PostgreSQL configuration."
    echo "Make sure PostgreSQL is running and the credentials are correct."
fi