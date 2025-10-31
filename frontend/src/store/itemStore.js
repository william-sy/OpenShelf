import { create } from 'zustand';
import api from '../services/api';

export const useItemStore = create((set, get) => ({
  items: [],
  loading: false,
  error: null,
  filter: {
    type: '',
    search: '',
  },

  setFilter: (filter) => {
    set({ filter: { ...get().filter, ...filter } });
  },

  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const { type, search } = get().filter;
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (search) params.append('search', search);

      const response = await api.get(`/api/items?${params.toString()}`);
      set({ items: response.data, loading: false });
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
