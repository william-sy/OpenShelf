# OpenShelf - Display Name & MusicBrainz Fields Update

## Completed Work

### 1. Display Name Feature ✅
Added optional display name field for users:

**Backend Changes:**
- Updated `initDatabase.js` to add `display_name` column to users table
- Added migration logic to add column to existing databases
- Updated `User.js` model to handle display_name in create/update/select queries
- Updated `auth.js` route to accept display_name parameter on registration

**Frontend Changes:**
- Updated `Register.jsx` to include display_name input field
- Updated `authStore.js` to pass display_name to registration API
- Display name is optional and shows as "How you want to be called"

### 2. MusicBrainz Research ✅
Researched MusicBrainz API structure for music and video releases.

**Key Fields Identified:**
Based on MusicBrainz Release documentation, the following fields are relevant for CD/Vinyl/DVD/Blu-ray:

```javascript
// These should be stored in the metadata JSON field
{
  // Label information
  "label": "Warner Records",
  "catalog_number": "9362-49430-2",
  
  // Release details
  "release_country": "US",
  "status": "official", // official, promotion, bootleg, pseudo-release, withdrawn
  
  // Format details  
  "media_format": "CD", // "CD", "2× CD", "12\" Vinyl", "Blu-ray", etc.
  "disc_count": 1,
  "total_tracks": 12,
  
  // Packaging
  "packaging": "Jewel Case", // Jewel Case, Digipak, Gatefold Cover, etc.
  
  // Audio/Video specific
  "duration": "3600", // Total duration in seconds
  "region": "1", // DVD/Blu-ray region code
  "aspect_ratio": "16:9", // For video
  "video_format": "PAL" // PAL, NTSC, etc.
}
```

## Next Steps (TODO)

### 3. Update Frontend Forms
- Modify `AddItem.jsx` and `EditItem.jsx` to show/hide fields based on type:
  - For `cd`, `vinyl`: Show label, catalog_number, media_format, disc_count, total_tracks
  - For `dvd`, `bluray`: Show label, catalog_number, region, aspect_ratio, video_format
  - All types: packaging, release_country

### 4. Update ItemDetail Display
- Show music/video specific metadata fields in the detail view
- Format them nicely (e.g., "2× CD" instead of raw data)
- Only show fields that have values

### 5. Consider MusicBrainz API Integration (Future)
- Could add lookup by barcode for music releases
- Similar to ISBN lookup for books
- Would auto-populate: label, catalog_number, tracks, etc.

## Database Schema
No migration needed! All music/video fields can be stored in the existing `metadata` JSON column.

Current schema supports:
```sql
metadata TEXT, -- JSON for extensible fields
```

This allows storing arbitrary key-value pairs without schema changes.

## Files Modified

### Backend
1. `/backend/src/scripts/initDatabase.js` - Added display_name column and migration
2. `/backend/src/models/User.js` - Updated to handle display_name
3. `/backend/src/routes/auth.js` - Added display_name parameter validation

### Frontend
4. `/frontend/src/pages/Register.jsx` - Added display_name input field
5. `/frontend/src/store/authStore.js` - Updated register function to pass display_name

## Testing Needed

1. Register new user with display name - verify it saves and displays
2. Register new user without display name - verify it's optional
3. Existing users - verify database migration adds column without breaking data
4. Add CD/Vinyl with music metadata - verify it saves in metadata JSON
5. Add DVD/Blu-ray with video metadata - verify it saves properly
6. Display item details - verify metadata displays correctly

## Notes

- MusicBrainz has rate limiting: 1 request per second
- Would need User-Agent header for API calls
- Consider caching MusicBrainz responses
- Packaging types: Jewel Case, Slim Jewel Case, Digipak, Cardboard/Paper Sleeve, Gatefold Cover, Discbox Slider, Keep Case, etc.
