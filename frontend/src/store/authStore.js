import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
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

      register: async (username, email, password, displayName, role = 'reader') => {
        const response = await api.post('/api/auth/register', { 
          username, 
          email, 
          password, 
          display_name: displayName,
          role 
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

      // Helper functions for RBAC
      isAdmin: () => {
        const { user } = get();
        return user?.role === 'admin';
      },

      canModifyItems: () => {
        const { user } = get();
        return user?.role === 'admin' || user?.role === 'user';
      },

      isReader: () => {
        const { user } = get();
        return user?.role === 'reader';
      },

      hasRole: (...roles) => {
        const { user } = get();
        return user && roles.includes(user.role);
      },

      getRole: () => {
        const { user } = get();
        return user?.role || null;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
