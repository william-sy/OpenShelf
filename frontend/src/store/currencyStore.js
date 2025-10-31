import { create } from 'zustand';
import api from '../services/api';

const useCurrencyStore = create((set, get) => ({
  currency: '$', // Default to USD
  currencySymbol: '$',
  currencyCode: 'USD',
  loaded: false,
  
  // Load currency from backend
  loadCurrency: async () => {
    try {
      const response = await api.get('/api/settings/apis');
      const currency = response.data.currency || 'USD';
      get().setCurrency(currency);
      set({ loaded: true });
    } catch (error) {
      console.error('Failed to load currency setting:', error);
      // Use default USD if loading fails
      set({ loaded: true });
    }
  },
  
  setCurrency: async (currency) => {
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
    
    // Save to backend (don't await to avoid blocking UI)
    try {
      const response = await api.get('/api/settings/apis');
      await api.put('/api/settings/apis', {
        ...response.data,
        currency: selected.code
      });
    } catch (error) {
      console.error('Failed to save currency setting:', error);
    }
  },
  
  formatPrice: (price) => {
    if (!price) return '';
    const symbol = get().currencySymbol;
    return `${symbol}${parseFloat(price).toFixed(2)}`;
  }
}));

export { useCurrencyStore };
