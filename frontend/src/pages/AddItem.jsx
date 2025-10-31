import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useItemStore } from '../store/itemStore';
import toast from 'react-hot-toast';
import { FiSearch, FiCamera, FiX } from 'react-icons/fi';
import ISBNScanner from '../components/ISBNScanner';
import api from '../services/api';

export default function AddItem() {
  const navigate = useNavigate();
  const { addItem, lookupISBN } = useItemStore();
  const [showScanner, setShowScanner] = useState(false);
  const [formData, setFormData] = useState({
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
    tmdb_id: '',
    jellyfin_id: '',
    jellyfin_url: '',
    comicvine_id: '',
    wishlist: false,
  });
  const [creatorInput, setCreatorInput] = useState({ name: '', role: 'author' });
  const [tagInput, setTagInput] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tmdbResults, setTmdbResults] = useState([]);
  const [jellyfinResults, setJellyfinResults] = useState([]);
  const [comicVineResults, setComicVineResults] = useState([]);
  const [showTmdbResults, setShowTmdbResults] = useState(false);
  const [showJellyfinResults, setShowJellyfinResults] = useState(false);
  const [showComicVineResults, setShowComicVineResults] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

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

      setFormData(prev => ({
        ...prev,
        cover_url: `${import.meta.env.VITE_API_URL}${response.data.url}`,
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
      toast.success(`Found: ${result.data.title}`);
    } catch (error) {
      console.error('ISBN lookup failed:', error);
      toast.error('ISBN lookup failed - book data not found. Please enter details manually.', { 
        duration: 4000 
      });
    } finally {
      setLookingUp(false);
    }
  };

  const handleScan = async (isbn) => {
    setFormData({ ...formData, isbn });
    setShowScanner(false);
    
    // Only try lookup once
    setLookingUp(true);
    try {
      const result = await lookupISBN(isbn);
      const creators = (result.data.authors || []).map(name => ({ name, role: 'author' }));
      setFormData({
        ...formData,
        ...result.data,
        isbn,
        creators,
        authors: result.data.authors || [],
      });
      toast.success(`Found: ${result.data.title}`);
    } catch (error) {
      console.error('ISBN lookup failed:', error);
      // Just set the ISBN and let user fill in details manually
      setFormData({
        ...formData,
        isbn,
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
      toast.success(`Loaded: ${data.title}`);
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
    setFormData({
      ...formData,
      title: result.title || formData.title,
      subtitle: result.subtitle || formData.subtitle,
      description: result.description || formData.description,
      cover_url: result.cover_url || formData.cover_url,
      jellyfin_id: result.jellyfin_id,
      jellyfin_url: result.jellyfin_url,
      creators: result.creators || formData.creators,
    });
    setShowJellyfinResults(false);
    setSearchQuery('');
    toast.success(`Linked to Jellyfin: ${result.title}`);
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

  const handleComicVineSelect = async (result) => {
    setLookingUp(true);
    try {
      const response = await api.get(`/api/lookup/comicvine/volume/${result.comicvine_id}`);
      const data = response.data.data;
      
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
        tags: data.tags || [],
        page_count: data.page_count || '',
      });
      setShowComicVineResults(false);
      setSearchQuery('');
      toast.success(`Loaded: ${data.title}`);
    } catch (error) {
      console.error('Comic Vine details failed:', error);
      toast.error('Failed to load comic details');
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
              <label className="label">ISBN Lookup {formData.type === 'comic' && '(works for graphic novels with ISBN)'}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleChange}
                  placeholder="Enter ISBN (10 or 13 digits)"
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
              <input
                type="url"
                name="cover_url"
                value={formData.cover_url}
                onChange={handleChange}
                placeholder="Or enter image URL"
                className="input"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">or</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>
              {uploadingImage && (
                <p className="text-sm text-gray-600 dark:text-gray-400">Uploading image...</p>
              )}
            </div>
          </div>

          <div>

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
          </div>
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

          <div>
            <label className="label">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag and press Enter"
                className="input flex-1"
              />
              <button type="button" onClick={addTag} className="btn btn-secondary">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100"
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
                        src={result.cover_url}
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
                        src={result.cover_url}
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

      {/* Comic Vine Search Results Modal */}
      {showComicVineResults && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Comic Vine Search Results</h3>
              <button
                onClick={() => setShowComicVineResults(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {comicVineResults.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No results found. Try a different search term.
              </p>
            ) : (
              <div className="space-y-3">
                {comicVineResults.map((result) => (
                  <button
                    key={result.comicvine_id}
                    onClick={() => handleComicVineSelect(result)}
                    className="w-full flex gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
                  >
                    {result.cover_url && (
                      <img
                        src={result.cover_url}
                        alt={result.title}
                        className="w-16 h-24 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">{result.title}</h4>
                      {result.publisher && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{result.publisher}</p>
                      )}
                      {result.year && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">Started: {result.year}</p>
                      )}
                      {result.issue_count && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{result.issue_count} issues</p>
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
    </div>
  );
}
