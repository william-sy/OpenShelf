import axios from 'axios';

// Dynamically determine API URL based on current location
// This allows the app to work on localhost, LAN IP, or custom domains
// BUILD: 2025-11-17-21:30:00
const getApiUrl = () => {
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Otherwise, determine based on the current location
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // Debug logging to see what we're detecting
  console.log('Detected location:', { protocol, hostname, port });
  
  // If frontend is on standard HTTP/HTTPS port (80/443) with no port specified,
  // assume nginx is proxying and use same origin
  if (port === '80' || port === '443' || port === '') {
    console.log('Using same-origin API (nginx proxy expected)');
    return `${protocol}//${hostname}`;
  }
  
  // For port 3000 or any other port, connect directly to backend on port 3001
  // This handles both development (vite on 5173) and Docker (frontend on 3000)
  console.log('Using direct backend connection on port 3001');
  return `${protocol}//${hostname}:3001`;
};

const API_URL = getApiUrl();
console.log('API URL:', API_URL); // Debug log

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  // Try to get token from localStorage first (backwards compatibility)
  let token = localStorage.getItem('token');
  
  // If not found, try to get it from the Zustand persist store
  if (!token) {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        token = parsed.state?.token;
      }
    } catch (e) {
      console.error('Error parsing auth-storage:', e);
    }
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('API Request:', config.method?.toUpperCase(), config.url, 'Base:', config.baseURL);
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error.message);
    console.error('API Error Details:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Only redirect to login if:
    // 1. We have a token (meaning it's invalid/expired)
    // 2. We get 401 or 403
    // 3. We're not already on the login/register page
    const hasToken = !!localStorage.getItem('token');
    const isAuthError = error.response?.status === 401 || error.response?.status === 403;
    const isOnAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';
    
    if (hasToken && isAuthError && !isOnAuthPage) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;
export { API_URL };
