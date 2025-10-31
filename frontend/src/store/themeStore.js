import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set) => ({
      isDark: false,
      toggleTheme: () => set((state) => {
        const newIsDark = !state.isDark;
        // Update document class
        if (newIsDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { isDark: newIsDark };
      }),
      initTheme: () => set((state) => {
        // Apply stored theme on init
        if (state.isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return state;
      }),
    }),
    {
      name: 'theme-storage',
    }
  )
);
