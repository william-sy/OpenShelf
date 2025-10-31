import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (username, password) => {
        const response = await api.post('/api/auth/login', { username, password });
        const { user, token } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        set({ user, token, isAuthenticated: true });
        return user;
      },

      register: async (username, email, password, displayName) => {
        const response = await api.post('/api/auth/register', { 
          username, 
          email, 
          password, 
          display_name: displayName 
        });
        const { user, token } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        set({ user, token, isAuthenticated: true });
        return user;
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
