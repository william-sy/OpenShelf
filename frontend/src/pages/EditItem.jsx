import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useItemStore } from '../store/itemStore';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';
import api from '../services/api';

export default function EditItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getItemById, updateItem, fetchItems } = useItemStore();
  const [formData, setFormData] = useState(null);
  const [creatorInput, setCreatorInput] = useState({ name: '', role: 'author' });
  const [tagInput, setTagInput] = useState('');
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

  useEffect(() => {
    fetchItems().then(() => {
      const item = getItemById(id);
      if (item) {
        setFormData({
          ...item,
          creators: item.creators || [],
          page_count: item.page_count || '',
          rating: item.rating || '',
        });
      } else {
        toast.error('Item not found');
        navigate('/items');
      }
    });
  }, [id, getItemById, fetchItems, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      const response = await api.post('/api/upload', uploadFormData, {
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
    } finally {
      setUploadingImage(false);
    }
  };

  const addCreator = () => {
    if (creatorInput.name.trim()) {
      setFormData({
        ...formData,
        creators: [...(formData.creators || []), { name: creatorInput.name.trim(), role: creatorInput.role }],
      });
      setCreatorInput({ name: '', role: 'author' });
    }
  };

  const removeCreator = (index) => {
    setFormData({
      ...formData,
      creators: formData.creators.filter((_, i) => i !== index),
    });
  };

  const addTag = () => {
    if (tagInput.trim()) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
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

      await updateItem(parseInt(id), itemData);
      toast.success('Item updated successfully!');
      navigate(`/items/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update item');
    }
  };

  if (!formData) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Item</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Update item information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
              value={formData.subtitle || ''}
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
              {(formData.creators || []).map((creator, index) => (
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
                value={formData.publisher || ''}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="label">Publish Date</label>
              <input
                type="text"
                name="publish_date"
                value={formData.publish_date || ''}
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
              value={formData.description || ''}
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
                value={formData.cover_url || ''}
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
              <select name="condition" value={formData.condition || ''} onChange={handleChange} className="input">
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
              value={formData.location || ''}
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
              {(formData.tags || []).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
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
              value={formData.notes || ''}
              onChange={handleChange}
              rows={3}
              className="input"
              placeholder="Personal notes about this item..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary flex-1">
            Save Changes
          </button>
          <button
            type="button"
            onClick={() => navigate(`/items/${id}`)}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
