# TMDB API Integration for Movies/TV

## Overview
The Movie Database (TMDB) provides free API access for movie and TV show metadata. Unlike books (which have ISBNs), Blu-rays and DVDs don't have a standardized metadata lookup by UPC/barcode.

## API Key
- Register at: https://www.themoviedb.org/settings/api
- Free tier available
- Rate limiting applies (check current limits in docs)

## Lookup Methods

### 1. Search by Title
**Endpoint:** `GET https://api.themoviedb.org/3/search/movie`

**Parameters:**
- `query` (required): Movie title
- `year` (optional): Release year
- `page` (optional): Page number
- `include_adult` (optional): Include adult content

**Response includes:**
- `id`: TMDB movie ID
- `title`: Original title
- `overview`: Plot summary
- `release_date`: Release date
- `poster_path`: Poster image path
- `backdrop_path`: Backdrop image path
- `vote_average`: Rating
- `genre_ids`: Genre IDs

### 2. Get Movie Details
**Endpoint:** `GET https://api.themoviedb.org/3/movie/{movie_id}`

**Response includes:**
- All search fields plus:
- `runtime`: Runtime in minutes
- `budget`: Production budget
- `revenue`: Box office revenue
- `genres`: Full genre objects with names
- `production_companies`: Production companies
- `production_countries`: Countries
- `spoken_languages`: Languages
- `tagline`: Movie tagline
- `homepage`: Official website
- `status`: Release status

### 3. Get Credits (Cast/Crew)
**Endpoint:** `GET https://api.themoviedb.org/3/movie/{movie_id}/credits`

**Response includes:**
- `cast`: Array of actors with character names
- `crew`: Array of crew members (director, writer, etc.)

### 4. Find by External ID (IMDb)
**Endpoint:** `GET https://api.themoviedb.org/3/find/{external_id}`

**Parameters:**
- `external_source`: Set to `imdb_id` for IMDb IDs
- Format: `tt1234567` (IMDb ID)

**Supported external sources:**
- IMDb ID (for movies and TV)
- TheTVDB ID (for TV only)
- Facebook ID
- Instagram ID
- Twitter ID

## Implementation Plan

### Phase 1: Title-based Search
Since UPC barcodes don't map directly to TMDB, we'll implement title-based search:

1. **Backend Route:** `POST /api/tmdb/search`
   - Accept `title` and optional `year`
   - Return top 5 results
   - Include poster images

2. **Backend Route:** `GET /api/tmdb/movie/:id`
   - Fetch full movie details
   - Fetch credits
   - Combine into single response

### Phase 2: Manual Selection in Frontend
1. User scans barcode or enters title
2. Show search results (with posters)
3. User selects correct movie
4. Populate form with movie data

### Metadata Fields to Store

In the `metadata` JSON field:

```json
{
  "tmdb_id": 12345,
  "imdb_id": "tt1234567",
  "overview": "Plot summary...",
  "release_date": "2023-01-01",
  "runtime": 120,
  "rating": 7.5,
  "genres": ["Action", "Thriller"],
  "director": "Director Name",
  "cast": ["Actor 1", "Actor 2"],
  "tagline": "Movie tagline"
}
```

### Image Handling
TMDB returns image paths like `/abc123.jpg`. Prepend with base URL:
- Base URL: `https://image.tmdb.org/t/p/`
- Sizes: `w92`, `w154`, `w185`, `w342`, `w500`, `w780`, `original`
- Full URL example: `https://image.tmdb.org/t/p/w500/abc123.jpg`

## Implementation Notes

### Environment Variables
Add to `.env`:
```
TMDB_API_KEY=your_api_key_here
TMDB_BASE_URL=https://api.themoviedb.org/3
```

### Rate Limiting
- TMDB enforces rate limits
- Cache responses when possible
- Consider implementing request throttling

### Authentication
TMDB v3 API uses API key in query parameter or header:
- Query: `?api_key=YOUR_API_KEY`
- Header: `Authorization: Bearer YOUR_API_KEY`

## Similar Approach for TV Shows

Use the same pattern for TV shows with these endpoints:
- Search: `GET /api/tmdb/search/tv`
- Details: `GET /api/tmdb/tv/{tv_id}`
- Credits: `GET /api/tmdb/tv/{tv_id}/credits`

## Current Status
- ✅ Research completed
- ⏳ Backend routes pending
- ⏳ Frontend search UI pending
- ⏳ Environment configuration pending
