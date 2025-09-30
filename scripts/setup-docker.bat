@echo off
REM Docker PostgreSQL Setup Script for Inventory Booking App (Windows)

echo 🐳 Setting up PostgreSQL with Docker for Inventory Booking App...

REM Check if Docker is available
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not in PATH.
    echo Please install Docker from https://docs.docker.com/get-docker/
    pause
    exit /b 1
)

REM Check if Docker Compose is available
where docker-compose >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed or not in PATH.
    echo Please install Docker Compose from https://docs.docker.com/compose/install/
    pause
    exit /b 1
)

echo 🔄 Starting PostgreSQL container...

REM Start Docker Compose
docker-compose up -d

echo ⏳ Waiting for PostgreSQL to be ready...
timeout /t 10 /nobreak >nul

REM Update .env file
echo 📝 Updating .env file...
echo DATABASE_URL="postgresql://inventory_user:inventory_password_123@localhost:5432/inventory_booking" > .env

echo ✅ .env file updated!

REM Test connection
echo 🔍 Testing database connection...
npm run db:migrate >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Database connection successful!
    
    REM Seed the database
    echo 🌱 Seeding database...
    npm run db:seed
    echo ✅ Database seeded successfully!
    
    echo 🎉 Docker PostgreSQL setup completed successfully!
    echo.
    echo 📊 Database Management:
    echo - PostgreSQL: localhost:5432
    echo - pgAdmin: http://localhost:8080
    echo - pgAdmin Email: admin@example.com
    echo - pgAdmin Password: admin123
    echo.
    echo You can now run the application with: npm run dev
) else (
    echo ❌ Database connection failed. Please check Docker container status.
    echo Run: docker-compose logs
)

pause