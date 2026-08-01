import { create } from 'zustand';
import api from '../services/api';

const PAGE_SIZE = 60;

export const useItemStore = create((set, get) => ({
  items: [], // Filtered items for current view
  allItems: [], // Complete collection (always unfiltered)
  loading: false,
  error: null,
  allItemsLoading: false,
  allItemsError: null,
  hasMore: false,
  loadingMore: false,
  filter: {
    type: '',
    search: '',
    wishlist: null, // null = all, true = wishlist only, false = owned only
    favorite: null, // null = all, true = favorites only
    sortBy: 'created_at',
    sortOrder: 'desc',
  },

  setFilter: (filter) => {
    const currentFilter = get().filter;
    const newFilter = { ...currentFilter, ...filter };
    set({ filter: newFilter });
  },

  // Fetch all items without filters (for dashboard stats)
  fetchAllItems: async () => {
    set({ allItemsLoading: true, allItemsError: null });
    try {
      const response = await api.get('/api/items');
      set({ allItems: response.data, allItemsLoading: false });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch all items:', error);
      set({ allItemsLoading: false, allItemsError: error.message || 'Failed to load items' });
      return [];
    }
  },

  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const { type, search, wishlist, favorite, sortBy, sortOrder } = get().filter;
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (search) params.append('search', search);
      if (wishlist !== null) params.append('wishlist', wishlist);
      if (favorite !== null) params.append('favorite', favorite);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);
      params.append('limit', PAGE_SIZE);
      params.append('offset', 0);

      const response = await api.get(`/api/items?${params.toString()}`);
      set({
        items: response.data,
        loading: false,
        hasMore: response.data.length === PAGE_SIZE,
      });

      // Also update allItems if no filters are applied
      if (!type && !search && wishlist === null && favorite === null) {
        set({ allItems: response.data });
      }
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchMoreItems: async () => {
    if (get().loadingMore || !get().hasMore) return;
    set({ loadingMore: true });
    try {
      const { type, search, wishlist, favorite, sortBy, sortOrder } = get().filter;
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (search) params.append('search', search);
      if (wishlist !== null) params.append('wishlist', wishlist);
      if (favorite !== null) params.append('favorite', favorite);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);
      params.append('limit', PAGE_SIZE);
      params.append('offset', get().items.length);

      const response = await api.get(`/api/items?${params.toString()}`);
      set({
        items: [...get().items, ...response.data],
        loadingMore: false,
        hasMore: response.data.length === PAGE_SIZE,
      });
    } catch (error) {
      set({ loadingMore: false });
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
