import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useItemStore } from '../store/itemStore';
import { useCurrencyStore } from '../store/currencyStore';
import toast from 'react-hot-toast';
import { FiSearch, FiCamera, FiX } from 'react-icons/fi';
import ISBNScanner from '../components/ISBNScanner';
import api, { API_URL } from '../services/api';

// Helper to convert relative API URLs to absolute URLs
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/api/')) return `${API_URL}${url}`;
  if (url.startsWith('/')) return `${API_URL}${url}`;
  return url;
};

export default function AddItem() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem, lookupISBN } = useItemStore();
  const { currencyCode } = useCurrencyStore();
  const [showScanner, setShowScanner] = useState(false);
  
  // Check if we're duplicating an item
  const duplicateFrom = location.state?.duplicateFrom;
  
  const [formData, setFormData] = useState(duplicateFrom || {
    type: 'book',
    title: '',
    subtitle: '',
    creators: [],
    authors: [], // Legacy compatibility
    isbn: '',
    barcode: '',
    publisher: '',
    publish_date: '',
    description: '',
    cover_url: '',
    page_count: '',
    language: 'en',
    notes: '',
    tags: [],
    rating: '',
    condition: '',
    location: '',
    purchase_date: '',
    purchase_price: '',
    tmdb_id: '',
    jellyfin_id: '',
    jellyfin_url: '',
    comicvine_id: '',
    wishlist: false,
  });
  
  // Show toast if duplicating
  useEffect(() => {
    if (duplicateFrom) {
      toast.success('Creating duplicate - Update the details for this copy');
    }
  }, [duplicateFrom]);

  const [creatorInput, setCreatorInput] = useState({ name: '', role: 'author' });
  const [tagInput, setTagInput] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tmdbResults, setTmdbResults] = useState([]);
  const [jellyfinResults, setJellyfinResults] = useState([]);
  const [comicVineResults, setComicVineResults] = useState([]);
  const [musicBrainzResults, setMusicBrainzResults] = useState([]);
  const [showTmdbResults, setShowTmdbResults] = useState(false);
  const [showJellyfinResults, setShowJellyfinResults] = useState(false);
  const [showComicVineResults, setShowComicVineResults] = useState(false);
  const [showMusicBrainzResults, setShowMusicBrainzResults] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [comicVineFilter, setComicVineFilter] = useState('all'); // 'all', 'issues', 'volumes'
  const [comicVineSortBy, setComicVineSortBy] = useState('relevance'); // 'relevance', 'year', 'title'

  const creatorRoles = [
    { value: 'author', label: 'Author' },
    { value: 'writer', label: 'Writer' },
    { value: 'illustrator', label: 'Illustrator' },
    { value: 'artist', label: 'Artist' },
    { value: 'singer', label: 'Singer' },
    { value: 'songwriter', label: 'Songwriter' },
    { value: 'composer', label: 'Composer' },
    { value: 'director', label: 'Director' },
    { value: 'actor', label: 'Actor' },
    { value: 'band', label: 'Band' },
    { value: 'other', label: 'Other' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Backend now returns full URL, no need to prepend API URL
      setFormData(prev => ({
        ...prev,
        cover_url: response.data.url,
      }));

      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload image');
      console.error('Upload error:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleISBNLookup = async () => {
    if (!formData.isbn) {
      toast.error('Please enter an ISBN');
      return;
    }

    setLookingUp(true);
    try {
      const result = await lookupISBN(formData.isbn);
      // Convert authors to creators format
      const creators = (result.data.authors || []).map(name => ({ name, role: 'author' }));
      setFormData({
        ...formData,
        ...result.data,
        creators,
        authors: result.data.authors || [],
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success(`Found: ${result.data.title}. Review the details and click "Add Item" to save.`, { duration: 5000 });
    } catch (error) {
      console.error('ISBN lookup failed:', error);
      toast.error('ISBN lookup failed - book data not found. Please enter details manually.', { 
        duration: 4000 
      });
    } finally {
      setLookingUp(false);
    }
  };

  const handleScan = async (barcode) => {
    setFormData({ ...formData, isbn: barcode });
    setShowScanner(false);
    
    // Only try ISBN lookup for books, comics, and ebooks
    if (!['book', 'comic', 'ebook'].includes(formData.type)) {
      toast.success('Barcode scanned successfully');
      return;
    }
    
    // Only try lookup once
    setLookingUp(true);
    try {
      const result = await lookupISBN(barcode);
      const creators = (result.data.authors || []).map(name => ({ name, role: 'author' }));
      setFormData({
        ...formData,
        ...result.data,
        isbn: barcode,
        creators,
        authors: result.data.authors || [],
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success(`Found: ${result.data.title}. Review the details and click "Add Item" to save.`, { duration: 5000 });
    } catch (error) {
      console.error('ISBN lookup failed:', error);
      // Just set the ISBN and let user fill in details manually
      setFormData({
        ...formData,
        isbn: barcode,
      });
      toast.error('ISBN lookup failed - please enter details manually', { duration: 4000 });
    } finally {
      setLookingUp(false);
    }
  };

  const handleTmdbSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setLookingUp(true);
    try {
      const response = await api.get('/api/lookup/tmdb/search', {
        params: {
          q: searchQuery,
          type: formData.type === 'dvd' || formData.type === 'bluray' ? 'movie' : 'tv'
        }
      });
      setTmdbResults(response.data.results || []);
      setShowTmdbResults(true);
    } catch (error) {
      console.error('TMDB search failed:', error);
      toast.error(error.response?.data?.message || 'TMDB search failed. Please check your API settings.');
    } finally {
      setLookingUp(false);
    }
  };

  const handleTmdbSelect = async (result) => {
    setLookingUp(true);
    try {
      const response = await api.get(`/api/lookup/tmdb/${formData.type === 'dvd' || formData.type === 'bluray' ? 'movie' : 'tv'}/${result.tmdb_id}`);
      const data = response.data.data;
      
      setFormData({
        ...formData,
        title: data.title,
        subtitle: data.subtitle || '',
        description: data.description || '',
        cover_url: data.cover_url || '',
        publish_date: data.release_date || '',
        creators: data.creators || [],
        rating: data.rating || '',
        tmdb_id: data.tmdb_id,
        tags: data.genres || [],
      });
      setShowTmdbResults(false);
      setSearchQuery('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success(`Loaded: ${data.title}. Review the details and click "Add Item" to save.`, { duration: 5000 });
    } catch (error) {
      console.error('TMDB details failed:', error);
      toast.error('Failed to load movie details');
    } finally {
      setLookingUp(false);
    }
  };

  const handleJellyfinSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setLookingUp(true);
    try {
      const response = await api.get('/api/lookup/jellyfin/search', {
        params: {
          q: searchQuery,
          type: formData.type
        }
      });
      setJellyfinResults(response.data.results || []);
      setShowJellyfinResults(true);
    } catch (error) {
      console.error('Jellyfin search failed:', error);
      toast.error(error.response?.data?.message || 'Jellyfin search failed. Please check your API settings.');
    } finally {
      setLookingUp(false);
    }
  };

  const handleJellyfinSelect = (result) => {
    // Map Jellyfin types to our types
    let itemType = formData.type; // Keep current type by default
    if (result.type === 'Movie' || result.type === 'Episode') {
      itemType = 'dvd'; // Default to DVD for video content
    } else if (result.type === 'Audio' || result.type === 'MusicAlbum') {
      itemType = 'cd'; // Default to CD for audio content
    }
    
    // Prepare metadata with track info if available
    const metadata = {};
    if (result.track_count) {
      metadata.track_count = result.track_count;
      metadata.tracks = result.tracks;
      metadata.total_duration = result.total_duration;
    }
    
    setFormData({
      ...formData,
      type: itemType,
      title: result.title || formData.title,
      subtitle: result.subtitle || formData.subtitle,
      description: result.description || formData.description,
      // Use cover_url_proxy (triggers download on save) instead of cover_url (direct Jellyfin URL)
      cover_url: result.cover_url_proxy || formData.cover_url,
      jellyfin_id: result.jellyfin_id,
      jellyfin_url: result.jellyfin_url,
      creators: result.creators || formData.creators,
      metadata: metadata, // Store as object, backend will stringify
    });
    setShowJellyfinResults(false);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success(`Linked to Jellyfin: ${result.title}. Review the details and click "Add Item" to save.`, { duration: 5000 });
  };

  const handleComicVineSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setLookingUp(true);
    try {
      const response = await api.get('/api/lookup/comicvine/search', {
        params: {
          q: searchQuery
        }
      });
      setComicVineResults(response.data.results || []);
      setShowComicVineResults(true);
    } catch (error) {
      console.error('Comic Vine search failed:', error);
      toast.error(error.response?.data?.message || 'Comic Vine search failed. Please check your API settings.');
    } finally {
      setLookingUp(false);
    }
  };

  // Filter and sort Comic Vine results
  const getFilteredComicVineResults = () => {
    let filtered = [...comicVineResults];
    
    // Apply filter
    if (comicVineFilter === 'issues') {
      filtered = filtered.filter(r => r.resource_type === 'issue');
    } else if (comicVineFilter === 'volumes') {
      filtered = filtered.filter(r => r.resource_type === 'volume');
    }
    
    // Apply sort
    if (comicVineSortBy === 'year') {
      filtered.sort((a, b) => {
        const yearA = a.year || 0;
        const yearB = b.year || 0;
        return yearB - yearA; // Newest first
      });
    } else if (comicVineSortBy === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }
    // 'relevance' keeps the original order from the API
    
    return filtered;
  };

  const handleComicVineSelect = async (result) => {
    setLookingUp(true);
    try {
      const response = await api.get(`/api/lookup/comicvine/volume/${result.comicvine_id}`, {
        params: {
          type: result.resource_type || 'volume'
        }
      });
      const data = response.data.data;
      
      // Extract series name from metadata if available
      const seriesName = data.metadata?.volume_name;
      const tags = [...(data.tags || [])];
      if (seriesName && !tags.some(tag => tag.startsWith('Series: '))) {
        tags.push(`Series: ${seriesName}`);
      }
      
      setFormData({
        ...formData,
        title: data.title,
        subtitle: data.subtitle || '',
        description: data.description || '',
        cover_url: data.cover_url || '',
        publish_date: data.publish_date || '',
        publisher: data.publisher || '',
        creators: data.creators || [],
        comicvine_id: data.comicvine_id,
        tags: tags,
        page_count: data.page_count || '',
      });
      setShowComicVineResults(false);
      setSearchQuery('');
      
      // Scroll to top of form so user can review the loaded data
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      toast.success(`Loaded: ${data.title}. Review the details below and click "Add Item" to save.`, { duration: 5000 });
    } catch (error) {
      console.error('Comic Vine details failed:', error);
      toast.error(error.response?.data?.message || 'Failed to load comic details');
    } finally {
      setLookingUp(false);
    }
  };

  const handleMusicBrainzSearch = async () => {
    if (!searchQuery.trim() && !formData.barcode) {
      toast.error('Please enter a search query or barcode');
      return;
    }

    setLookingUp(true);
    try {
      const response = await api.get('/api/lookup/musicbrainz/search', {
        params: {
          q: searchQuery || undefined,
          barcode: formData.barcode || undefined
        }
      });
      setMusicBrainzResults(response.data.results || []);
      setShowMusicBrainzResults(true);
    } catch (error) {
      console.error('MusicBrainz search failed:', error);
      toast.error(error.response?.data?.message || 'MusicBrainz search failed. Please try again.');
    } finally {
      setLookingUp(false);
    }
  };

  const handleMusicBrainzSelect = async (result) => {
    setLookingUp(true);
    try {
      const response = await api.get(`/api/lookup/musicbrainz/release/${result.musicbrainz_id}`);
      const data = response.data.data;
      
      // Prepare metadata with track info
      const metadata = {};
      if (data.metadata?.track_count) {
        metadata.track_count = data.metadata.track_count;
        metadata.tracks = data.metadata.tracks;
        metadata.total_duration = data.metadata.total_duration;
        metadata.format = data.metadata.format;
        metadata.country = data.metadata.country;
      }
      
      setFormData({
        ...formData,
        title: data.title,
        subtitle: data.subtitle || '',
        description: data.description || '',
        cover_url: data.cover_url || '',
        publish_date: data.publish_date || '',
        publisher: data.publisher || '',
        creators: data.creators || [],
        barcode: data.barcode || formData.barcode,
        metadata: metadata, // Store as object, backend will stringify
        tags: [
          ...(formData.tags || []),
          ...(data.metadata?.country ? [`Country: ${data.metadata.country}`] : []),
          ...(data.metadata?.format ? [`Format: ${data.metadata.format}`] : [])
        ]
      });
      setShowMusicBrainzResults(false);
      setSearchQuery('');
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success(`Loaded from MusicBrainz: ${data.title}. Review the details and click "Add Item" to save.`, { duration: 5000 });
    } catch (error) {
      console.error('MusicBrainz details failed:', error);
      toast.error(error.response?.data?.message || 'Failed to load release details');
    } finally {
      setLookingUp(false);
    }
  };

  const addCreator = () => {
    if (creatorInput.name.trim()) {
      setFormData({
        ...formData,
        creators: [...formData.creators, { name: creatorInput.name.trim(), role: creatorInput.role }],
        authors: [...formData.authors, creatorInput.name.trim()], // Legacy
      });
      setCreatorInput({ name: '', role: 'author' });
    }
  };

  const removeCreator = (index) => {
    setFormData({
      ...formData,
      creators: formData.creators.filter((_, i) => i !== index),
      authors: formData.creators.filter((_, i) => i !== index).map(c => c.name),
    });
  };

  const addTag = () => {
    if (tagInput.trim()) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (index) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const itemData = {
        ...formData,
        page_count: formData.page_count ? parseInt(formData.page_count) : null,
        rating: formData.rating ? parseInt(formData.rating) : null,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
      };

      await addItem(itemData);
      toast.success('Item added successfully!');
      navigate('/items');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add item');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Add Item</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Add a new item to your library</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type Selection */}
        <div className="card">
          <label className="label">Item Type *</label>
          <div className="flex flex-wrap gap-2">
            {['book', 'comic', 'cd', 'vinyl', 'dvd', 'bluray', 'ebook', 'other'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData({ ...formData, type })}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  formData.type === type
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* ISBN/Barcode Lookup (for books and comics) */}
        {(formData.type === 'book' || formData.type === 'comic') && (
          <div className="card space-y-4">
            {formData.type === 'comic' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Search for Comic</h3>
                
                {/* Comic Vine Search */}
                <div>
                  <label className="label">Search Comic Vine</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleComicVineSearch())}
                      placeholder="Search for comic series/volume..."
                      className="input flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleComicVineSearch}
                      disabled={lookingUp || !searchQuery.trim()}
                      className="btn btn-primary disabled:opacity-50"
                    >
                      <FiSearch className="inline mr-2" />
                      {lookingUp ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Get metadata, cover art, and details from Comic Vine database
                  </p>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
              </>
            )}
            
            <div>
              <label className="label">
                {['book', 'comic', 'ebook'].includes(formData.type) 
                  ? `ISBN Lookup ${formData.type === 'comic' ? '(works for graphic novels with ISBN)' : ''}`
                  : 'Barcode / UPC'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleChange}
                  placeholder={['book', 'comic', 'ebook'].includes(formData.type) 
                    ? "Enter ISBN (10 or 13 digits)"
                    : "Enter barcode or UPC"}
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="btn btn-secondary"
                  title={['book', 'comic', 'ebook'].includes(formData.type) ? "Scan ISBN" : "Scan barcode"}
                >
                  <FiCamera className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleISBNLookup}
                  disabled={lookingUp || !formData.isbn}
                  className="btn btn-primary disabled:opacity-50"
                >
                  <FiSearch className="inline mr-2" />
                  {lookingUp ? 'Looking up...' : 'Lookup'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Music Lookup (for CDs and Vinyl) */}
        {(formData.type === 'cd' || formData.type === 'vinyl') && (
          <div className="card space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Search for Music</h3>
            
            {/* Jellyfin Search */}
            <div>
              <label className="label">Search Jellyfin Library</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleJellyfinSearch())}
                  placeholder="Search for album or artist in your Jellyfin library..."
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={handleJellyfinSearch}
                  disabled={lookingUp || !searchQuery.trim()}
                  className="btn btn-primary disabled:opacity-50"
                >
                  <FiSearch className="inline mr-2" />
                  {lookingUp ? 'Searching...' : 'Search'}
                </button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Link this item to your local Jellyfin media for playback
              </p>
            </div>
            
            <div>
              <label className="label">Barcode (Optional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  placeholder="Enter barcode or UPC"
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="btn btn-secondary"
                  title="Scan barcode"
                >
                  <FiCamera className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <label className="label">Search MusicBrainz</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleMusicBrainzSearch())}
                  placeholder="Search for album or artist..."
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={handleMusicBrainzSearch}
                  disabled={lookingUp || (!searchQuery.trim() && !formData.barcode)}
                  className="btn btn-primary disabled:opacity-50"
                >
                  <FiSearch className="inline mr-2" />
                  {lookingUp ? 'Searching...' : 'Search'}
                </button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Search MusicBrainz database by album name or use the barcode above
              </p>
            </div>
          </div>
        )}

        {/* Video Lookup (for DVDs and Blu-rays) */}
        {(formData.type === 'dvd' || formData.type === 'bluray') && (
          <div className="card space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Search for Movie/TV Show</h3>
            
            {/* TMDB Search */}
            <div>
              <label className="label">Search TMDB (The Movie Database)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTmdbSearch())}
                  placeholder="Search for movie or TV show title..."
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={handleTmdbSearch}
                  disabled={lookingUp || !searchQuery.trim()}
                  className="btn btn-primary disabled:opacity-50"
                >
                  <FiSearch className="inline mr-2" />
                  {lookingUp ? 'Searching...' : 'Search'}
                </button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Get metadata, cast, crew, and poster from TMDB
              </p>
            </div>

            {/* Jellyfin Search */}
            <div>
              <label className="label">Search Jellyfin Library</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleJellyfinSearch())}
                  placeholder="Search for movie in your Jellyfin library..."
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={handleJellyfinSearch}
                  disabled={lookingUp || !searchQuery.trim()}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  <FiSearch className="inline mr-2" />
                  {lookingUp ? 'Search Jellyfin' : 'Search'}
                </button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Link this item to your local Jellyfin media for playback
              </p>
            </div>
            
            <div>
              <label className="label">Barcode (Optional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  placeholder="Enter barcode or UPC"
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="btn btn-secondary"
                  title="Scan barcode"
                >
                  <FiCamera className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Note: UPC barcodes don't directly map to movie databases
              </p>
            </div>
          </div>
        )}

        {/* Basic Info */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>

          <div>
            <label className="label">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Subtitle</label>
            <input
              type="text"
              name="subtitle"
              value={formData.subtitle}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label className="label">Creators (Authors, Artists, etc.)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={creatorInput.name}
                onChange={(e) => setCreatorInput({ ...creatorInput, name: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCreator())}
                placeholder="Name"
                className="input flex-1"
              />
              <select
                value={creatorInput.role}
                onChange={(e) => setCreatorInput({ ...creatorInput, role: e.target.value })}
                className="input w-40"
              >
                {creatorRoles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <button type="button" onClick={addCreator} className="btn btn-secondary">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.creators.map((creator, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                >
                  {creator.name} <span className="text-primary-500">({creator.role})</span>
                  <button
                    type="button"
                    onClick={() => removeCreator(index)}
                    className="hover:text-primary-900"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Publisher</label>
              <input
                type="text"
                name="publisher"
                value={formData.publisher}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="label">Publish Date</label>
              <input
                type="text"
                name="publish_date"
                value={formData.publish_date}
                onChange={handleChange}
                placeholder="YYYY or YYYY-MM-DD"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="input"
            />
          </div>

          <div>
            <label className="label">Cover Image</label>
            <div className="space-y-2">
              {formData.cover_url && formData.cover_url.startsWith('/api/') ? (
                <div>
                  <input
                    type="text"
                    value={
                      formData.cover_url.includes('jellyfin') ? 'Using Jellyfin cover image' :
                      formData.cover_url.includes('tmdb') ? 'Using TMDB cover image' :
                      'Using auto-fetched cover image'
                    }
                    readOnly
                    className="input bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Cover image auto-fetched • <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, cover_url: '' })}
                      className="text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Clear to use custom URL
                    </button>
                  </p>
                </div>
              ) : (
                <input
                  type="url"
                  name="cover_url"
                  value={formData.cover_url}
                  onChange={handleChange}
                  placeholder="Enter image URL (https://...)"
                  className="input"
                />
              )}
              {/* Only show file upload if not using Jellyfin/API image */}
              {(!formData.cover_url || !formData.cover_url.startsWith('/api/')) && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">or</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                </div>
              )}
              {uploadingImage && (
                <p className="text-sm text-gray-600 dark:text-gray-400">Uploading image...</p>
              )}
            </div>
          </div>

          {/* Page Count - Only for books, comics, and ebooks */}
          {['book', 'comic', 'ebook'].includes(formData.type) && (
            <div>
              <label className="label">Page Count</label>
              <input
                type="number"
                name="page_count"
                value={formData.page_count}
                onChange={handleChange}
                className="input"
              />
            </div>
          )}
        </div>

        {/* Additional Details */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Additional Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Rating</label>
              <select name="rating" value={formData.rating} onChange={handleChange} className="input">
                <option value="">No rating</option>
                {[1, 2, 3, 4, 5].map((r) => (
                  <option key={r} value={r}>
                    {'⭐'.repeat(r)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Condition</label>
              <select name="condition" value={formData.condition} onChange={handleChange} className="input">
                <option value="">Select condition</option>
                <option value="mint">Mint</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Shelf A, Box 3"
              className="input"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Purchase Date (YYYY-MM-DD)</label>
              <input
                type="text"
                name="purchase_date"
                value={formData.purchase_date}
                onChange={handleChange}
                placeholder="YYYY-MM-DD"
                pattern="\d{4}-\d{2}-\d{2}"
                className="input"
              />
            </div>

            <div>
              <label className="label">Purchase Price ({currencyCode})</label>
              <div className="relative">
                <input
                  type="number"
                  name="purchase_price"
                  value={formData.purchase_price}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Series field for comics */}
          {formData.type === 'comic' && (
            <div>
              <label className="label">Series Name</label>
              <input
                type="text"
                value={formData.tags.find(tag => tag.startsWith('Series: '))?.replace('Series: ', '') || ''}
                onChange={(e) => {
                  const seriesName = e.target.value;
                  // Remove any existing series tag
                  const otherTags = formData.tags.filter(tag => !tag.startsWith('Series: '));
                  // Add new series tag if not empty
                  if (seriesName.trim()) {
                    setFormData({
                      ...formData,
                      tags: [...otherTags, `Series: ${seriesName}`]
                    });
                  } else {
                    setFormData({
                      ...formData,
                      tags: otherTags
                    });
                  }
                }}
                placeholder="e.g., Asterix, Batman, Spider-Man"
                className="input"
              />
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                This will be added as a "Series: {'{name}'}" tag for easy filtering
              </p>
            </div>
          )}

          <div>
            <label className="label">Tags</label>
            
            {/* Quick Tag Suggestions */}
            <div className="mb-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Quick Add:</p>
              <div className="flex flex-wrap gap-2">
                {/* Language Tags */}
                {['English', 'Dutch', 'French', 'German', 'Spanish', 'Italian', 'Japanese'].map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      if (!formData.tags.includes(lang)) {
                        setFormData({ ...formData, tags: [...formData.tags, lang] });
                        toast.success(`Added ${lang} tag`);
                      }
                    }}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      formData.tags.includes(lang)
                        ? 'bg-blue-500 text-white cursor-not-allowed'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900'
                    }`}
                    disabled={formData.tags.includes(lang)}
                  >
                    {lang} {formData.tags.includes(lang) ? '✓' : null}
                  </button>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {/* Genre/Category Tags */}
                {['Fiction', 'Non-Fiction', 'Biography', 'Science Fiction', 'Fantasy', 'Mystery', 'Horror', 'Romance', 'Thriller', 'Comedy', 'Drama', 'Action'].map(genre => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => {
                      if (!formData.tags.includes(genre)) {
                        setFormData({ ...formData, tags: [...formData.tags, genre] });
                        toast.success(`Added ${genre} tag`);
                      }
                    }}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      formData.tags.includes(genre)
                        ? 'bg-green-500 text-white cursor-not-allowed'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900'
                    }`}
                    disabled={formData.tags.includes(genre)}
                  >
                    {genre} {formData.tags.includes(genre) ? '✓' : null}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Tag Input */}
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add custom tag and press Enter"
                className="input flex-1"
              />
              <button type="button" onClick={addTag} className="btn btn-secondary">
                Add
              </button>
            </div>
            
            {/* Selected Tags */}
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                    tag.startsWith('Series: ')
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Personal Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="input"
              placeholder="Personal notes about this item..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="wishlist"
              name="wishlist"
              checked={formData.wishlist}
              onChange={(e) => setFormData({ ...formData, wishlist: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="wishlist" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
              Add to Wishlist (item not yet owned)
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary flex-1">
            Add Item
          </button>
          <button
            type="button"
            onClick={() => navigate('/items')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* ISBN Scanner Modal */}
      {showScanner && (
        <ISBNScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* TMDB Search Results Modal */}
      {showTmdbResults && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">TMDB Search Results</h3>
              <button
                onClick={() => setShowTmdbResults(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {tmdbResults.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No results found. Try a different search term.
              </p>
            ) : (
              <div className="space-y-3">
                {tmdbResults.map((result) => (
                  <button
                    key={result.tmdb_id}
                    onClick={() => handleTmdbSelect(result)}
                    className="w-full flex gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
                  >
                    {result.cover_url && (
                      <img
                        src={getImageUrl(result.cover_url)}
                        alt={result.title}
                        className="w-16 h-24 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{result.title}</h4>
                      {result.release_date && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(result.release_date).getFullYear()}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                        {result.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Jellyfin Search Results Modal */}
      {showJellyfinResults && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Jellyfin Library Results</h3>
              <button
                onClick={() => setShowJellyfinResults(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {jellyfinResults.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No results found in your Jellyfin library. Try a different search term.
              </p>
            ) : (
              <div className="space-y-3">
                {jellyfinResults.map((result) => (
                  <button
                    key={result.jellyfin_id}
                    onClick={() => handleJellyfinSelect(result)}
                    className="w-full flex gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
                  >
                    {result.cover_url && (
                      <img
                        src={getImageUrl(result.cover_url)}
                        alt={result.title}
                        className="w-16 h-24 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{result.title}</h4>
                      {result.subtitle && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{result.subtitle}</p>
                      )}
                      {result.year && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{result.year}</p>
                      )}
                      {result.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                          {result.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MusicBrainz Search Results Modal */}
      {showMusicBrainzResults && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">MusicBrainz Results</h3>
              <button
                onClick={() => setShowMusicBrainzResults(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {musicBrainzResults.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No results found on MusicBrainz. Try a different search term or barcode.
              </p>
            ) : (
              <div className="space-y-3">
                {musicBrainzResults.map((result) => (
                  <button
                    key={result.musicbrainz_id}
                    onClick={() => handleMusicBrainzSelect(result)}
                    className="w-full flex gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
                  >
                    {result.cover_url_musicbrainz && (
                      <img
                        src={result.cover_url_musicbrainz}
                        alt={result.title}
                        className="w-16 h-24 object-cover rounded"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{result.title}</h4>
                      {result.subtitle && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{result.subtitle}</p>
                      )}
                      <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {result.year && <span>{result.year}</span>}
                        {result.country && <span>{result.country}</span>}
                        {result.format && <span>{result.format}</span>}
                        {result.track_count && <span>{result.track_count} tracks</span>}
                      </div>
                      {result.label && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Label: {result.label}</p>
                      )}
                      {result.barcode && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">Barcode: {result.barcode}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comic Vine Search Results Modal */}
      {showComicVineResults && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Comic Vine Search Results ({getFilteredComicVineResults().length})
              </h3>
              <button
                onClick={() => setShowComicVineResults(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Filter and Sort Controls */}
            <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Show:</label>
                <select
                  value={comicVineFilter}
                  onChange={(e) => setComicVineFilter(e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="all">All Results</option>
                  <option value="issues">Issues Only</option>
                  <option value="volumes">Series Only</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</label>
                <select
                  value={comicVineSortBy}
                  onChange={(e) => setComicVineSortBy(e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="relevance">Relevance</option>
                  <option value="year">Year (Newest)</option>
                  <option value="title">Title (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Results List */}
            <div className="overflow-y-auto flex-1">
              {getFilteredComicVineResults().length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  {comicVineResults.length === 0 
                    ? 'No results found. Try a different search term.'
                    : 'No results match the current filter.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {getFilteredComicVineResults().map((result) => (
                    <button
                      key={result.comicvine_id}
                      onClick={() => handleComicVineSelect(result)}
                      className="w-full flex gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
                    >
                      {result.cover_url && (
                        <img
                          src={getImageUrl(result.cover_url)}
                          alt={result.title}
                          className="w-16 h-24 object-cover rounded flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex-1">
                            {result.title}
                          </h4>
                          {result.resource_type && (
                            <span className={`px-2 py-0.5 text-xs font-medium rounded flex-shrink-0 ${
                              result.resource_type === 'issue'
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                            }`}>
                              {result.resource_type === 'issue' ? 'Issue' : 'Series'}
                            </span>
                          )}
                        </div>
                        {result.subtitle && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{result.subtitle}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                          {result.publisher && <span>📚 {result.publisher}</span>}
                          {result.year && <span>📅 {result.year}</span>}
                          {result.issue_count && <span>📖 {result.issue_count} issues</span>}
                        </div>
                        {result.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-2">
                            {result.description.replace(/<[^>]*>/g, '')}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
