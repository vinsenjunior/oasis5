@echo off
REM PostgreSQL Setup Script for Inventory Booking App (Windows)

echo 🚀 Setting up PostgreSQL for Inventory Booking App...

REM Check if psql is available
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL is not installed or not in PATH.
    echo Please install PostgreSQL from https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

REM Database configuration
set DB_NAME=inventory_booking
set DB_USER=inventory_user
set DB_PASSWORD=inventory_password_123

echo 📊 Creating database and user...

REM Create database
psql -U postgres -c "CREATE DATABASE %DB_NAME%;" 2>nul || echo Database %DB_NAME% already exists

REM Create user
psql -U postgres -c "CREATE USER %DB_USER% WITH PASSWORD '%DB_PASSWORD%';" 2>nul || echo User %DB_USER% already exists

REM Grant privileges
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE %DB_NAME% TO %DB_USER%;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO %DB_USER%;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO %DB_USER%;"

echo ✅ Database setup completed!

REM Update .env file
echo 📝 Updating .env file...
echo DATABASE_URL="postgresql://%DB_USER%:%DB_PASSWORD%@localhost:5432/%DB_NAME%" > .env

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
    
    echo 🎉 PostgreSQL setup completed successfully!
    echo You can now run the application with: npm run dev
) else (
    echo ❌ Database connection failed. Please check your PostgreSQL configuration.
    echo Make sure PostgreSQL is running and the credentials are correct.
)

pause