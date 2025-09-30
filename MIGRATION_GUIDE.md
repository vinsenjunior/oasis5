# Database Migration Guide: SQLite to PostgreSQL

## 🚀 Migration Steps

### 1. **Install PostgreSQL**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (Homebrew)
brew install postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

### 2. **Start PostgreSQL Service**
```bash
# Ubuntu/Debian
sudo systemctl start postgresql
sudo systemctl enable postgresql

# macOS
brew services start postgresql
```

### 3. **Create Database and User**
```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE inventory_booking;

# Create user
CREATE USER inventory_user WITH PASSWORD 'your_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE inventory_booking TO inventory_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO inventory_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO inventory_user;

# Exit psql
\q
```

### 4. **Update Environment Variables**
Edit `.env` file:
```
DATABASE_URL="postgresql://inventory_user:your_password_here@localhost:5432/inventory_booking"
```

### 5. **Generate Prisma Client**
```bash
npm run db:generate
```

### 6. **Create Initial Migration**
```bash
npm run db:migrate
```

### 7. **Seed the Database**
```bash
npm run db:seed
```

### 8. **Test the Application**
```bash
npm run dev
```

## 🔍 Important Notes

### **Schema Differences**
- **Auto-increment fields**: PostgreSQL uses `SERIAL` or `BIGSERIAL` instead of SQLite's `AUTOINCREMENT`
- **Data types**: Some data types might need adjustment
- **Foreign keys**: PostgreSQL has stricter foreign key constraints

### **Data Migration**
If you need to migrate existing data from SQLite:

1. **Export data from SQLite**:
```bash
sqlite3 db/custom.db ".dump" > sqlite_dump.sql
```

2. **Convert to PostgreSQL format** (manual adjustment needed):
```bash
# Convert SQLite dump to PostgreSQL format
# You might need to adjust:
# - AUTOINCREMENT to SERIAL
# - Data types
# - Function names
```

3. **Import to PostgreSQL**:
```bash
psql -U inventory_user -d inventory_booking -f converted_dump.sql
```

### **Testing Checklist**
- [ ] All CRUD operations work correctly
- [ ] Foreign key constraints are properly enforced
- [ ] Date/time operations work as expected
- [ ] Pagination and filtering work correctly
- [ ] Authentication and authorization work
- [ ] All API endpoints return expected results

### **Performance Considerations**
- PostgreSQL is generally faster for complex queries
- Indexes might need to be recreated
- Connection pooling configuration might need adjustment
- Query optimization might be needed for some operations

### **Backup and Recovery**
```bash
# Backup PostgreSQL database
pg_dump -U inventory_user inventory_booking > backup.sql

# Restore PostgreSQL database
psql -U inventory_user inventory_booking < backup.sql
```

### **Troubleshooting**

#### **Common Issues**
1. **Connection errors**: Check PostgreSQL service status and credentials
2. **Permission errors**: Ensure user has proper privileges
3. **Schema errors**: Check Prisma schema compatibility
4. **Data type errors**: Adjust field types as needed

#### **Useful Commands**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# View database connections
psql -U inventory_user -d inventory_booking -c "SELECT * FROM pg_stat_activity;"

# View table sizes
psql -U inventory_user -d inventory_booking -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables WHERE schemaname='public';"

# Reset database
npm run db:reset
```

## 🎯 Next Steps

1. **Test thoroughly** with all user roles (admin, sales, guest)
2. **Monitor performance** and optimize queries if needed
3. **Set up automated backups** for production
4. **Configure connection pooling** for better performance
5. **Set up monitoring** for database health

## 📚 Additional Resources

- [Prisma PostgreSQL Documentation](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgreSQL Best Practices](https://www.postgresql.org/docs/current/best-practices.html)