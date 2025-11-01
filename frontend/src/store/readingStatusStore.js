import { create } from 'zustand';
import api from '../services/api';

const useReadingStatusStore = create((set, get) => ({
  readingStatuses: {}, // itemId -> status object mapping
  
  // Fetch reading status for a specific item
  fetchReadingStatus: async (itemId) => {
    try {
      const response = await api.get(`/api/reading-status/${itemId}`);
      set((state) => ({
        readingStatuses: {
          ...state.readingStatuses,
          [itemId]: response.data.status ? response.data : null
        }
      }));
      return response.data;
    } catch (error) {
      console.error('Error fetching reading status:', error);
      throw error;
    }
  },
  
  // Update reading status for an item
  updateReadingStatus: async (itemId, status, startDate = null, endDate = null) => {
    try {
      const response = await api.put(`/api/reading-status/${itemId}`, {
        status,
        start_date: startDate,
        end_date: endDate
      });
      
      set((state) => ({
        readingStatuses: {
          ...state.readingStatuses,
          [itemId]: response.data
        }
      }));
      
      return response.data;
    } catch (error) {
      console.error('Error updating reading status:', error);
      throw error;
    }
  },
  
  // Delete reading status for an item
  deleteReadingStatus: async (itemId) => {
    try {
      await api.delete(`/api/reading-status/${itemId}`);
      
      set((state) => {
        const newStatuses = { ...state.readingStatuses };
        delete newStatuses[itemId];
        return { readingStatuses: newStatuses };
      });
    } catch (error) {
      console.error('Error deleting reading status:', error);
      throw error;
    }
  },
  
  // Get reading status for an item from cache
  getReadingStatus: (itemId) => {
    return get().readingStatuses[itemId] || null;
  },
  
  // Clear all reading statuses (useful for logout)
  clearReadingStatuses: () => {
    set({ readingStatuses: {} });
  }
}));

export default useReadingStatusStore;
