import { create } from 'zustand';
import api from '../services/api';

const useCurrencyStore = create((set, get) => ({
  currency: '$', // Default to USD
  currencySymbol: '$',
  currencyCode: 'USD',
  loaded: false,
  
  // Load currency from user preferences (authenticated) or system-wide setting (public)
  loadCurrency: async () => {
    try {
      // Try to load from user preferences first (authenticated endpoint)
      const response = await api.get('/api/users/me/preferences');
      const currency = response.data.currency || 'USD';
      get().setCurrencyLocal(currency);
      set({ loaded: true });
    } catch (authError) {
      // If not authenticated (401) or request failed, try public system-wide setting
      // This is expected behavior, not an error
      try {
        const response = await api.get('/api/settings/currency');
        const currency = response.data.currency || 'USD';
        get().setCurrencyLocal(currency);
        set({ loaded: true });
      } catch (publicError) {
        // Only log if both endpoints fail
        console.warn('Could not load currency from backend, using default USD');
        get().setCurrencyLocal('USD');
        set({ loaded: true });
      }
    }
  },
  
  // Set currency locally without saving to backend
  setCurrencyLocal: (currency) => {
    const currencyMap = {
      'USD': { symbol: '$', code: 'USD' },
      'EUR': { symbol: '€', code: 'EUR' },
      'GBP': { symbol: '£', code: 'GBP' },
      'JPY': { symbol: '¥', code: 'JPY' },
      'CAD': { symbol: 'C$', code: 'CAD' },
      'AUD': { symbol: 'A$', code: 'AUD' },
      'CHF': { symbol: 'CHF', code: 'CHF' },
    };
    
    const selected = currencyMap[currency] || currencyMap['USD'];
    set({
      currency: selected.symbol,
      currencySymbol: selected.symbol,
      currencyCode: selected.code
    });
  },
  
  // Set currency and save to user preferences (all authenticated users)
  setCurrency: async (currency) => {
    get().setCurrencyLocal(currency);
    
    // Save to user preferences (requires authentication)
    try {
      await api.put('/api/users/me/preferences', { currency });
    } catch (error) {
      console.error('Failed to save currency preference:', error);
      throw error; // Re-throw to show error to user
    }
  },
  
  formatPrice: (price) => {
    if (!price) return '';
    const symbol = get().currencySymbol;
    return `${symbol}${parseFloat(price).toFixed(2)}`;
  }
}));

export { useCurrencyStore };
