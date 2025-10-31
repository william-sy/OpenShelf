import express from 'express';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth.js';
import { ApiSettings } from '../models/ApiSettings.js';

const router = express.Router();

// TMDB API configuration (fallback to env vars)
const TMDB_API_KEY_DEFAULT = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Jellyfin API configuration (fallback to env vars)
const JELLYFIN_URL_DEFAULT = process.env.JELLYFIN_URL;
const JELLYFIN_API_KEY_DEFAULT = process.env.JELLYFIN_API_KEY;

// Comic Vine API configuration (fallback to env vars)
const COMICVINE_API_KEY_DEFAULT = process.env.COMICVINE_API_KEY;
const COMICVINE_BASE_URL = 'https://comicvine.gamespot.com/api';

// All routes require authentication
router.use(authenticateToken);

// Helper function to get user's API settings
const getUserApiSettings = (userId) => {
  const settings = ApiSettings.findByUserId(userId);
  return {
    tmdb_api_key: settings?.tmdb_api_key || TMDB_API_KEY_DEFAULT,
    jellyfin_url: settings?.jellyfin_url || JELLYFIN_URL_DEFAULT,
    jellyfin_api_key: settings?.jellyfin_api_key || JELLYFIN_API_KEY_DEFAULT,
    comicvine_api_key: settings?.comicvine_api_key || COMICVINE_API_KEY_DEFAULT
  };
};

// Lookup book by ISBN
router.get('/isbn/:isbn', async (req, res) => {
  try {
    const { isbn } = req.params;
    
    // Clean ISBN (remove dashes, spaces)
    const cleanIsbn = isbn.replace(/[-\s]/g, '');
    
    console.log(`Looking up ISBN: ${cleanIsbn}`);

    // Try Open Library first (no API key needed)
    try {
      const openLibraryResponse = await axios.get(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`,
        { timeout: 5000 }
      );

      const bookKey = `ISBN:${cleanIsbn}`;
      if (openLibraryResponse.data[bookKey]) {
        const book = openLibraryResponse.data[bookKey];
        
        return res.json({
          source: 'openlibrary',
          data: {
            isbn: cleanIsbn,
            title: book.title,
            subtitle: book.subtitle,
            authors: book.authors?.map(a => a.name) || [],
            publisher: book.publishers?.[0]?.name,
            publish_date: book.publish_date,
            description: book.notes || book.description,
            cover_url: book.cover?.large || book.cover?.medium || book.cover?.small,
            page_count: book.number_of_pages,
            language: 'en' // Open Library doesn't always provide this
          }
        });
      }
    } catch (openLibError) {
      console.warn('Open Library lookup failed:', openLibError.message);
    }

    // Try Google Books as fallback
    try {
      console.log('Trying Google Books API...');
      const googleBooksResponse = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`,
        { timeout: 10000 }
      );

      console.log(`Google Books returned ${googleBooksResponse.data.totalItems || 0} items`);

      if (googleBooksResponse.data.items && googleBooksResponse.data.items.length > 0) {
        const book = googleBooksResponse.data.items[0].volumeInfo;
        
        console.log(`Found book: ${book.title}`);
        
        return res.json({
          source: 'googlebooks',
          data: {
            isbn: cleanIsbn,
            title: book.title,
            subtitle: book.subtitle,
            authors: book.authors || [],
            publisher: book.publisher,
            publish_date: book.publishedDate,
            description: book.description,
            cover_url: book.imageLinks?.large || book.imageLinks?.medium || book.imageLinks?.thumbnail,
            page_count: book.pageCount,
            language: book.language
          }
        });
      }
    } catch (googleError) {
      console.warn('Google Books lookup failed:', googleError.message);
    }

    // If both APIs fail
    res.status(404).json({ 
      error: 'Book not found',
      message: 'Could not find book information for this ISBN' 
    });

  } catch (error) {
    console.error('ISBN lookup error:', error);
    res.status(500).json({ 
      error: 'Lookup failed',
      message: 'An error occurred while looking up the ISBN'
    });
  }
});

// Search books by title/author
router.get('/search', async (req, res) => {
  try {
    const { q, type = 'book' } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    // For now, only support book searches
    if (type !== 'book') {
      return res.status(400).json({ error: 'Only book searches are currently supported' });
    }

    // Search Google Books
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=10`,
      { timeout: 5000 }
    );

    if (!response.data.items) {
      return res.json({ results: [] });
    }

    const results = response.data.items.map(item => ({
      title: item.volumeInfo.title,
      subtitle: item.volumeInfo.subtitle,
      authors: item.volumeInfo.authors || [],
      isbn: item.volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier ||
            item.volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier,
      publisher: item.volumeInfo.publisher,
      publish_date: item.volumeInfo.publishedDate,
      description: item.volumeInfo.description,
      cover_url: item.volumeInfo.imageLinks?.thumbnail,
      page_count: item.volumeInfo.pageCount
    }));

    res.json({ results });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Lookup movie/TV show by title using TMDB
router.get('/tmdb/search', async (req, res) => {
  try {
    const { q, type = 'movie' } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const userSettings = getUserApiSettings(req.user.id);
    
    if (!userSettings.tmdb_api_key) {
      return res.status(503).json({ 
        error: 'TMDB API not configured',
        message: 'Please configure your TMDB API key in Settings'
      });
    }

    const endpoint = type === 'tv' ? '/search/tv' : '/search/movie';
    const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
      params: {
        api_key: userSettings.tmdb_api_key,
        query: q,
        language: 'en-US',
        page: 1
      },
      timeout: 5000
    });

    if (!response.data.results || response.data.results.length === 0) {
      return res.json({ results: [] });
    }

    const results = response.data.results.slice(0, 10).map(item => ({
      tmdb_id: item.id,
      title: item.title || item.name,
      original_title: item.original_title || item.original_name,
      release_date: item.release_date || item.first_air_date,
      description: item.overview,
      cover_url: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
      backdrop_url: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
      rating: item.vote_average,
      popularity: item.popularity,
      type: type
    }));

    res.json({ results });

  } catch (error) {
    console.error('TMDB search error:', error.response?.data || error.message);
    res.status(500).json({ error: 'TMDB search failed' });
  }
});

// Get detailed movie/TV info by TMDB ID
router.get('/tmdb/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;

    const userSettings = getUserApiSettings(req.user.id);
    
    if (!userSettings.tmdb_api_key) {
      return res.status(503).json({ 
        error: 'TMDB API not configured',
        message: 'Please configure your TMDB API key in Settings'
      });
    }

    const endpoint = type === 'tv' ? `/tv/${id}` : `/movie/${id}`;
    const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, {
      params: {
        api_key: userSettings.tmdb_api_key,
        append_to_response: 'credits,external_ids',
        language: 'en-US'
      },
      timeout: 5000
    });

    const data = response.data;
    const credits = data.credits || {};

    res.json({
      source: 'tmdb',
      data: {
        tmdb_id: data.id,
        title: data.title || data.name,
        subtitle: data.tagline,
        release_date: data.release_date || data.first_air_date,
        description: data.overview,
        cover_url: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
        backdrop_url: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null,
        creators: [
          ...(credits.cast?.slice(0, 5).map(person => ({ name: person.name, role: person.character })) || []),
          ...(credits.crew?.filter(person => ['Director', 'Writer', 'Producer'].includes(person.job)).slice(0, 5).map(person => ({ name: person.name, role: person.job })) || [])
        ],
        rating: Math.round(data.vote_average / 2), // Convert 0-10 to 0-5
        genres: data.genres?.map(g => g.name) || [],
        runtime: data.runtime || data.episode_run_time?.[0],
        imdb_id: data.external_ids?.imdb_id,
        language: data.original_language,
        type: type
      }
    });

  } catch (error) {
    console.error('TMDB details error:', error.response?.data || error.message);
    res.status(500).json({ error: 'TMDB lookup failed' });
  }
});

// Search Jellyfin library for matching media
router.get('/jellyfin/search', async (req, res) => {
  try {
    const { q, type } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const userSettings = getUserApiSettings(req.user.id);
    
    if (!userSettings.jellyfin_url || !userSettings.jellyfin_api_key) {
      return res.status(503).json({ 
        error: 'Jellyfin not configured',
        message: 'Please configure your Jellyfin URL and API key in Settings'
      });
    }

    // Map our types to Jellyfin types
    const jellyfinType = {
      'cd': 'Audio',
      'vinyl': 'Audio',
      'dvd': 'Movie,Episode',
      'bluray': 'Movie,Episode'
    }[type] || 'Movie,Audio';

    const response = await axios.get(`${userSettings.jellyfin_url}/Items`, {
      params: {
        searchTerm: q,
        IncludeItemTypes: jellyfinType,
        Recursive: true,
        Limit: 10
      },
      headers: {
        'X-Emby-Token': userSettings.jellyfin_api_key
      },
      timeout: 5000
    });

    if (!response.data.Items || response.data.Items.length === 0) {
      return res.json({ results: [] });
    }

    const results = response.data.Items.map(item => ({
      jellyfin_id: item.Id,
      title: item.Name,
      subtitle: item.Album || item.AlbumArtist,
      year: item.ProductionYear,
      description: item.Overview,
      cover_url: item.ImageTags?.Primary 
        ? `${userSettings.jellyfin_url}/Items/${item.Id}/Images/Primary?api_key=${userSettings.jellyfin_api_key}`
        : null,
      jellyfin_url: `${userSettings.jellyfin_url}/web/index.html#!/details?id=${item.Id}`,
      type: item.Type,
      creators: item.Artists || item.People?.map(p => ({ name: p.Name, role: p.Role })) || []
    }));

    res.json({ results });

  } catch (error) {
    console.error('Jellyfin search error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Jellyfin search failed' });
  }
});

// Get Jellyfin playback URL for an item
router.get('/jellyfin/item/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const userSettings = getUserApiSettings(req.user.id);
    
    if (!userSettings.jellyfin_url || !userSettings.jellyfin_api_key) {
      return res.status(503).json({ 
        error: 'Jellyfin not configured',
        message: 'Please configure your Jellyfin URL and API key in Settings'
      });
    }

    const response = await axios.get(`${userSettings.jellyfin_url}/Items/${id}`, {
      headers: {
        'X-Emby-Token': userSettings.jellyfin_api_key
      },
      timeout: 5000
    });

    const item = response.data;

    res.json({
      source: 'jellyfin',
      data: {
        jellyfin_id: item.Id,
        title: item.Name,
        jellyfin_url: `${userSettings.jellyfin_url}/web/index.html#!/details?id=${item.Id}`,
        cover_url: item.ImageTags?.Primary 
          ? `${userSettings.jellyfin_url}/Items/${item.Id}/Images/Primary?api_key=${userSettings.jellyfin_api_key}`
          : null
      }
    });

  } catch (error) {
    console.error('Jellyfin item error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Jellyfin lookup failed' });
  }
});

// Search Comic Vine for comics/graphic novels
router.get('/comicvine/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const userSettings = getUserApiSettings(req.user.id);
    
    if (!userSettings.comicvine_api_key) {
      return res.status(503).json({ 
        error: 'Comic Vine not configured',
        message: 'Please configure your Comic Vine API key in Settings. Get one at https://comicvine.gamespot.com/api/'
      });
    }

    const response = await axios.get(`${COMICVINE_BASE_URL}/search/`, {
      params: {
        api_key: userSettings.comicvine_api_key,
        format: 'json',
        query: q,
        resources: 'volume', // Search for volumes (series/collections)
        limit: 10
      },
      headers: {
        'User-Agent': 'OpenShelf Library Manager'
      },
      timeout: 10000
    });

    if (response.data.error !== 'OK') {
      return res.status(500).json({ error: 'Comic Vine API error', details: response.data.error });
    }

    if (!response.data.results || response.data.results.length === 0) {
      return res.json({ results: [] });
    }

    const results = response.data.results.map(volume => ({
      comicvine_id: volume.id?.toString(),
      title: volume.name,
      subtitle: volume.publisher?.name,
      year: volume.start_year,
      description: volume.deck || volume.description,
      cover_url: volume.image?.medium_url || volume.image?.small_url,
      issue_count: volume.count_of_issues,
      publisher: volume.publisher?.name
    }));

    res.json({ results });

  } catch (error) {
    console.error('Comic Vine search error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        error: 'Invalid Comic Vine API key',
        message: 'Please check your Comic Vine API key in Settings'
      });
    }
    res.status(500).json({ error: 'Comic Vine search failed' });
  }
});

// Get Comic Vine volume details
router.get('/comicvine/volume/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const userSettings = getUserApiSettings(req.user.id);
    
    if (!userSettings.comicvine_api_key) {
      return res.status(503).json({ 
        error: 'Comic Vine not configured',
        message: 'Please configure your Comic Vine API key in Settings'
      });
    }

    const response = await axios.get(`${COMICVINE_BASE_URL}/volume/4050-${id}/`, {
      params: {
        api_key: userSettings.comicvine_api_key,
        format: 'json'
      },
      headers: {
        'User-Agent': 'OpenShelf Library Manager'
      },
      timeout: 10000
    });

    if (response.data.error !== 'OK') {
      return res.status(500).json({ error: 'Comic Vine API error', details: response.data.error });
    }

    const volume = response.data.results;

    // Extract creators from characters/people data
    const creators = [];
    if (volume.people) {
      volume.people.forEach(person => {
        creators.push({ name: person.name, role: 'creator' });
      });
    }

    // Clean HTML from description
    let description = volume.description || volume.deck || '';
    description = description.replace(/<[^>]*>/g, '').trim();

    res.json({
      source: 'comicvine',
      data: {
        comicvine_id: volume.id?.toString(),
        title: volume.name,
        subtitle: volume.publisher?.name,
        description: description,
        cover_url: volume.image?.medium_url || volume.image?.small_url,
        publish_date: volume.start_year?.toString(),
        publisher: volume.publisher?.name,
        creators: creators,
        tags: volume.genres?.map(g => g.name) || [],
        page_count: volume.count_of_issues, // Store issue count as page count
        metadata: {
          issue_count: volume.count_of_issues,
          api_url: volume.api_detail_url,
          site_url: volume.site_detail_url
        }
      }
    });

  } catch (error) {
    console.error('Comic Vine details error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        error: 'Invalid Comic Vine API key',
        message: 'Please check your Comic Vine API key in Settings'
      });
    }
    res.status(500).json({ error: 'Comic Vine lookup failed' });
  }
});

export default router;