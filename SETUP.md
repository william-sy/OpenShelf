# Setup Guide

## Prerequisites

- Docker and Docker Compose
- OR Node.js 20+ (for local development)

## Docker Deployment (Recommended)

### Basic Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd openshelf
   ```

2. **Start the application:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

4. **Login with default credentials:**
   - Username: `admin`
   - Password: `admin`
   - ⚠️ **Change this password immediately after first login!**

### Mobile Access Setup

To access OpenShelf from mobile devices on your local network:

1. **Find your computer's IP address:**
   
   **macOS/Linux:**
   ```bash
   # Option 1: Using ifconfig
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Option 2: Using ip
   ip addr show | grep "inet " | grep -v 127.0.0.1
   ```
   
   **Windows:**
   ```cmd
   ipconfig
   ```
   
   Look for your local IP address (usually starts with `192.168.` or `10.0.`)

2. **Configure firewall (if needed):**
   
   **macOS:**
   ```bash
   # Allow ports 3000 and 3001
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add $(which node)
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp $(which node)
   ```
   
   **Linux (ufw):**
   ```bash
   sudo ufw allow 3000
   sudo ufw allow 3001
   ```
   
   **Windows:**
   - Open Windows Defender Firewall
   - Create new Inbound Rules for ports 3000 and 3001

3. **Access from mobile:**
   - Use your IP address instead of localhost
   - Example: `http://192.168.1.100:3000`

### Troubleshooting Mobile Access

**Login fails on mobile but works on desktop:**

The issue is likely that the frontend is trying to connect to `localhost:3001` (the phone itself) instead of your computer. The CORS configuration has been updated to accept requests from any origin, but you need to access using your computer's IP address.

**Cannot connect from mobile:**

1. Verify both devices are on the same network
2. Check firewall settings on your computer
3. Make sure Docker containers are running: `docker-compose ps`
4. Test backend connectivity: `http://YOUR_IP:3001/health`

# Setup Guide

This guide will help you get OpenShelf up and running on your machine.

## Prerequisites

- **Docker & Docker Compose** (recommended) OR
- **Node.js 20+** and **npm** for local development

## Quick Start with Docker (Recommended)

1. **Clone or navigate to the project directory**
   ```bash
   cd /Users/william/personal/openshelf
   ```

2. **Copy environment file**
   ```bash
   cp .env.example .env
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

5. **Login with default credentials**
   - Username: `admin`
   - Password: `admin`
   - ⚠️ **Change the password immediately after first login!**

## Local Development Setup

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Copy environment file**
   ```bash
   cp .env.example .env
   ```

4. **Initialize the database**
   ```bash
   npm run init-db
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```
   
   Backend will be running at http://localhost:3001

### Frontend Setup

1. **Open a new terminal and navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Copy environment file**
   ```bash
   cp .env.example .env
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   
   Frontend will be running at http://localhost:5173

## Environment Variables

### Backend (.env)
```env
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this
DATABASE_PATH=./database/openshelf.db
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
```

## Production Deployment

### Using Docker Compose

1. **Update environment variables**
   ```bash
   # Edit docker-compose.yml or create .env file
   JWT_SECRET=your-secure-random-secret-here
   ```

2. **Build and start**
   ```bash
   docker-compose up -d --build
   ```

3. **View logs**
   ```bash
   docker-compose logs -f
   ```

4. **Stop the application**
   ```bash
   docker-compose down
   ```

### Data Backup

Your data is stored in a Docker volume. To backup:

```bash
# Backup database
docker-compose exec backend cat /app/data/openshelf.db > backup-$(date +%Y%m%d).db

# Or copy from volume
docker cp openshelf-backend-1:/app/data/openshelf.db ./backup.db
```

## Features

### Current Features (v1.0)

✅ User authentication and management
✅ Add items manually or via ISBN barcode scan
✅ Book metadata lookup via Open Library & Google Books APIs
✅ Browse and search your collection
✅ Support for multiple item types (books, comics, CDs, DVDs)
✅ Responsive, modern web UI
✅ Docker deployment
✅ SQLite database (easy backup)

### Planned Features (Future)

- Lending system with due dates and reminders
- MusicBrainz integration for CD metadata
- Comic Vine API for comic metadata
- Import/Export functionality (CSV, JSON)
- Advanced statistics and visualizations
- Mobile app

## Troubleshooting

### Database Issues

If you encounter database errors, try reinitializing:

```bash
# Local development
cd backend
rm database/openshelf.db
npm run init-db

# Docker
docker-compose down -v
docker-compose up -d
```

### Port Conflicts

If ports 3000 or 3001 are already in use, edit `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "3002:3001"  # Change host port
  frontend:
    ports:
      - "8080:80"    # Change host port
```

### Camera Not Working for Barcode Scanner

- Ensure you're using HTTPS (or localhost)
- Grant camera permissions in your browser
- Check browser console for errors

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Item Endpoints

- `GET /api/items` - Get all items (with filters)
- `GET /api/items/:id` - Get item by ID
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `GET /api/items/stats/summary` - Get collection stats

### Lookup Endpoints

- `GET /api/lookup/isbn/:isbn` - Lookup book by ISBN
- `GET /api/lookup/search?q=query` - Search books

## Development

### Project Structure

```
openshelf/
├── backend/
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth & validation
│   │   ├── scripts/        # Utility scripts
│   │   └── server.js       # Express app
│   └── database/           # SQLite database
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   ├── store/          # State management
│   │   └── App.jsx         # Main app
│   └── public/             # Static assets
└── docker-compose.yml      # Docker orchestration
```

### Adding New Item Types

The system is designed to be extensible. To add a new item type:

1. Add type to database schema (backend/src/scripts/initDatabase.js)
2. Update type validation in routes
3. Add UI elements for the new type
4. Implement metadata lookup service if needed

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review the troubleshooting section

---

Built with ❤️ using Node.js, React, and SQLite
