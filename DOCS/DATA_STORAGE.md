# Data Storage Guide

## Overview

OpenShelf stores all data in a **SQLite database file**. The location of this file depends on how you're running the application.

## Database Locations

### 1. **Localhost Development** (Running with `npm start`)
- **Location**: `backend/database/openshelf-dev.db`
- **Configuration**: Set in `backend/.env` file
- **Isolation**: Separate from Docker/production databases

### 2. **Docker Development** (Using `docker-compose.yml`)
- **Location**: Named Docker volume `openshelf-data`
- **Container Path**: `/app/data/openshelf.db`
- **Persistence**: Data persists between container restarts
- **Isolation**: Separate from localhost development

### 3. **Docker Production** (Using `docker-compose-prod.yml`)
- **Location**: `/opt/stelling19-01/openshelf/data/openshelf.db` (on host)
- **Container Path**: `/app/data/openshelf.db`
- **Persistence**: Data stored on host filesystem
- **Isolation**: Separate from development environments

## Preventing Data Conflicts

### Problem: Cross-Contamination
If multiple instances (localhost and remote server) share the same database file, you'll see changes from one instance appear in the other. This happens when:

- Both instances point to the same physical file
- A shared network drive or volume is mounted
- The `DATABASE_PATH` environment variable is not properly configured

### Solution: Environment-Specific Databases

**Use the `.env` file** to configure different database paths:

```bash
# backend/.env (for localhost development)
DATABASE_PATH=./database/openshelf-dev.db
```

```bash
# docker-compose.yml (for Docker development)
environment:
  - DATABASE_PATH=/app/data/openshelf.db
volumes:
  - openshelf-data:/app/data
```

```bash
# docker-compose-prod.yml (for production)
environment:
  - DATABASE_PATH=/app/data/openshelf.db
volumes:
  - /opt/stelling19-01/openshelf/data:/app/data
```

## What Data is Stored

The SQLite database contains:

1. **Users** - User accounts, passwords (hashed), roles, profile pictures
2. **Items** - Books, movies, music, etc. with metadata
3. **Reading Status** - Reading progress and statistics
4. **API Settings** - User-specific API keys and preferences
5. **Lending Records** - Track borrowed items (future feature)

## User Authentication

**JWT Tokens** are stored in the browser's localStorage:
- **Key**: `auth-storage`
- **Contents**: User info and authentication token
- **Scope**: Per-browser, per-domain

This is why:
- Different browsers need separate logins
- The same browser sees the same user across tabs
- Clearing localStorage logs you out

## File Uploads

Profile pictures and other uploads are stored separately:

- **Localhost**: `backend/uploads/`
- **Docker Dev**: Volume `openshelf-uploads` → `/app/uploads`
- **Docker Prod**: `/opt/stelling19-01/openshelf/uploads` → `/app/uploads`

## Quick Setup Guide

### For Localhost Development:

1. Copy the environment file:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. The `.env` file should contain:
   ```bash
   DATABASE_PATH=./database/openshelf-dev.db
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Your data will be in `backend/database/openshelf-dev.db`

### For Docker:

1. Use docker-compose:
   ```bash
   docker-compose up -d
   ```

2. Data is stored in Docker volume `openshelf-data`

3. To backup the data:
   ```bash
   docker cp openshelf-backend-1:/app/data/openshelf.db ./backup.db
   ```

### For Production:

1. Set your production path in `docker-compose-prod.yml`
2. Data is stored on the host at `/opt/stelling19-01/openshelf/data/openshelf.db`
3. Make sure to backup this directory regularly

## Backup Your Data

### Backup Commands:

**Localhost:**
```bash
cp backend/database/openshelf-dev.db backend/database/backup-$(date +%Y%m%d).db
```

**Docker:**
```bash
docker cp openshelf-backend-1:/app/data/openshelf.db ./backup-$(date +%Y%m%d).db
```

**Production:**
```bash
cp /opt/stelling19-01/openshelf/data/openshelf.db /opt/backups/openshelf-$(date +%Y%m%d).db
```

## Troubleshooting

### Issue: Changes appear across different instances

**Cause**: Multiple instances sharing the same database file

**Solution**:
1. Check your `DATABASE_PATH` environment variable
2. Use different database files for each environment
3. Restart your servers after changing `.env`

### Issue: Data disappeared after restart

**Cause**: Database file was not persisted

**Solution**:
- **Localhost**: Check if `backend/database/` directory exists
- **Docker**: Check if volumes are properly configured in docker-compose
- **Production**: Verify host volume paths are correct

### Issue: "Database is locked" error

**Cause**: Multiple processes trying to access the same database

**Solution**:
1. Stop all running instances
2. Use different database files for different environments
3. Make sure only one process accesses each database file

## Security Notes

- **Never commit** the `.env` file to git (it's in `.gitignore`)
- **Change the JWT_SECRET** in production
- **Backup regularly** - SQLite files can become corrupted
- **Restrict access** to the database file on the host system
- **User passwords** are hashed with bcrypt (cannot be reversed)
