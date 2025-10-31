# OpenShelf Development Notes

## Current Status: v1.0 - Complete! 🎉

All core features for version 1.0 have been implemented:

✅ Backend API with Express & SQLite
✅ User authentication & management
✅ Item management (CRUD operations)
✅ ISBN lookup integration (Open Library & Google Books)
✅ Barcode scanning with device camera
✅ Modern React frontend with Tailwind CSS
✅ Responsive design (mobile-friendly)
✅ Docker deployment
✅ Extensible architecture for multiple item types

## Next Steps to Get Running

1. **Install dependencies:**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend (in another terminal)
   cd frontend
   npm install
   ```

2. **Copy environment files:**
   ```bash
   cp .env.example .env
   cd backend && cp .env.example .env
   cd ../frontend && cp .env.example .env
   ```

3. **Initialize database:**
   ```bash
   cd backend
   npm run init-db
   ```

4. **Start development servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

5. **Access the app:**
   - Frontend: http://localhost:5173
   - Login with: admin / admin
   - **Change password immediately!**

## Architecture Overview

### Backend Stack
- **Framework**: Express.js
- **Database**: SQLite (better-sqlite3)
- **Auth**: JWT with bcrypt
- **APIs**: Open Library, Google Books
- **Validation**: express-validator

### Frontend Stack
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Routing**: React Router v6
- **UI**: React Icons, React Hot Toast
- **Scanner**: Html5-QRCode

### Database Schema

**users** table:
- id, username, email, password_hash, role, created_at, updated_at

**items** table (extensible):
- id, user_id, type, title, subtitle, authors (JSON), isbn
- publisher, publish_date, description, cover_url, page_count
- language, metadata (JSON), notes, tags (JSON)
- rating, condition, location, purchase_date, purchase_price
- created_at, updated_at

**lending** table (future use):
- id, item_id, borrower_name, borrower_contact
- lent_date, due_date, returned_date, notes, created_at

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/change-password

### Items
- GET /api/items (with filters: type, search, limit)
- GET /api/items/:id
- POST /api/items
- PUT /api/items/:id
- DELETE /api/items/:id
- GET /api/items/stats/summary

### Lookup
- GET /api/lookup/isbn/:isbn
- GET /api/lookup/search?q=query&type=book

### Users (admin only)
- GET /api/users
- GET /api/users/:id
- PUT /api/users/:id
- DELETE /api/users/:id

## Extensibility

The system is designed to be easily extended:

### Adding New Item Types

1. **Database**: Already supports any type via the `type` field
2. **Backend**: Update type validation in routes if needed
3. **Frontend**: Add UI elements in AddItem.jsx
4. **Metadata**: Create new lookup service (e.g., MusicBrainz for CDs)

### Adding Metadata Sources

Create a new service in `backend/src/services/`:
```javascript
export async function lookupCD(barcode) {
  // Call MusicBrainz API
  // Return standardized format
}
```

## Future Enhancements (v2.0+)

### Lending System
- Track who borrowed what
- Due date reminders
- Lending history

### Additional Metadata Sources
- MusicBrainz for CDs
- Comic Vine for comics
- IMDB for movies/DVDs

### Import/Export
- CSV import
- JSON export
- Backup/restore functionality

### Statistics & Insights
- Reading statistics
- Collection value tracking
- Genre/author breakdowns
- Charts and visualizations

### Mobile Features
- Progressive Web App (PWA)
- Offline support
- Camera optimization

### Social Features
- Wishlists
- Public collection sharing
- Friend recommendations

## Known Limitations

1. **Camera Scanner**: Requires HTTPS or localhost
2. **ISBN Lookup**: Limited to English books (expandable)
3. **User Management**: Basic implementation (no email verification)
4. **Search**: Simple text search (no fuzzy matching yet)
5. **Images**: Relies on external URLs (no upload yet)

## Testing Checklist

Before deploying to production:

- [ ] Change default admin password
- [ ] Set strong JWT_SECRET
- [ ] Test ISBN lookup with various books
- [ ] Test barcode scanner on mobile
- [ ] Verify database backups work
- [ ] Test with multiple users
- [ ] Check responsive design on different devices
- [ ] Test search and filtering
- [ ] Verify Docker deployment

## Deployment Considerations

### Security
- Use HTTPS in production
- Set strong JWT_SECRET
- Implement rate limiting (already included)
- Regular backups
- Keep dependencies updated

### Performance
- SQLite is fine for personal use
- Consider PostgreSQL for >10 users
- Add caching for ISBN lookups
- Optimize images (CDN or compression)

### Monitoring
- Set up logging
- Monitor disk space (database growth)
- Track API response times
- Set up alerts for errors

## Contributing Guidelines

When contributing:

1. Follow existing code style
2. Write clear commit messages
3. Test your changes
4. Update documentation
5. Keep dependencies minimal
6. Maintain backwards compatibility

## Useful Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Run production build

# Database
npm run init-db      # Initialize/reset database

# Docker
docker-compose up -d              # Start services
docker-compose down               # Stop services
docker-compose logs -f            # View logs
docker-compose exec backend sh    # Access backend container
docker-compose down -v            # Remove volumes (reset)

# Backup
docker cp openshelf-backend-1:/app/data/openshelf.db ./backup.db
```

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Open Library API](https://openlibrary.org/developers/api)
- [Google Books API](https://developers.google.com/books)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

Happy collecting! 📚🎵💿
