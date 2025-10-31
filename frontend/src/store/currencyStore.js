import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCurrencyStore = create(
  persist(
    (set) => ({
      currency: '$', // Default to USD
      currencySymbol: '$',
      currencyCode: 'USD',
      
      setCurrency: (currency) => {
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
      
      formatPrice: (price) => {
        if (!price) return '';
        const symbol = useCurrencyStore.getState().currencySymbol;
        return `${symbol}${parseFloat(price).toFixed(2)}`;
      }
    }),
    {
      name: 'currency-storage',
    }
  )
);

export { useCurrencyStore };
