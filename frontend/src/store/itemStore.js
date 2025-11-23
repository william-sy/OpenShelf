import { create } from 'zustand';
import api from '../services/api';

export const useItemStore = create((set, get) => ({
  items: [], // Filtered items for current view
  allItems: [], // Complete collection (always unfiltered)
  loading: false,
  error: null,
  filter: {
    type: '',
    search: '',
    wishlist: null, // null = all, true = wishlist only, false = owned only
    favorite: null, // null = all, true = favorites only
  },

  setFilter: (filter) => {
    const currentFilter = get().filter;
    const newFilter = { ...currentFilter, ...filter };
    console.log('setFilter called');
    console.log('Current filter:', currentFilter);
    console.log('Update:', filter);
    console.log('New filter:', newFilter);
    set({ filter: newFilter });
  },

  // Fetch all items without filters (for dashboard stats)
  fetchAllItems: async () => {
    try {
      const response = await api.get('/api/items');
      set({ allItems: response.data });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch all items:', error);
      return [];
    }
  },

  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const { type, search, wishlist, favorite } = get().filter;
      console.log('fetchItems called with filter:', { type, search, wishlist, favorite });
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (search) params.append('search', search);
      if (wishlist !== null) params.append('wishlist', wishlist);
      if (favorite !== null) params.append('favorite', favorite);
      
      console.log('API request: /api/items?' + params.toString());
      const response = await api.get(`/api/items?${params.toString()}`);
      console.log('Received', response.data.length, 'items');
      set({ items: response.data, loading: false });
      
      // Also update allItems if no filters are applied
      if (!type && !search && wishlist === null && favorite === null) {
        set({ allItems: response.data });
      }
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  addItem: async (itemData) => {
    const response = await api.post('/api/items', itemData);
    set({ items: [response.data, ...get().items] });
    return response.data;
  },

  updateItem: async (id, itemData) => {
    const response = await api.put(`/api/items/${id}`, itemData);
    set({
      items: get().items.map((item) =>
        item.id === id ? response.data : item
      ),
    });
    return response.data;
  },

  deleteItem: async (id) => {
    await api.delete(`/api/items/${id}`);
    set({ items: get().items.filter((item) => item.id !== id) });
  },

  getItemById: (id) => {
    return get().items.find((item) => item.id === parseInt(id));
  },

  lookupISBN: async (isbn) => {
    const response = await api.get(`/api/lookup/isbn/${isbn}`);
    return response.data;
  },

  searchBooks: async (query) => {
    const response = await api.get(`/api/lookup/search?q=${encodeURIComponent(query)}&type=book`);
    return response.data;
  },
}));
