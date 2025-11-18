import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { useCurrencyStore } from './store/currencyStore';
import { useEffect } from 'react';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ItemList from './pages/ItemList';
import AddItem from './pages/AddItem';
import EditItem from './pages/EditItem';
import ItemDetail from './pages/ItemDetail';
import Wishlist from './pages/Wishlist';
import Statistics from './pages/Statistics';
import ReadingStats from './pages/ReadingStats';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';

// Components
import Layout from './components/Layout';

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  const initTheme = useThemeStore((state) => state.initTheme);
  const loadCurrency = useCurrencyStore((state) => state.loadCurrency);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    initTheme();
  }, [initTheme]);
  
  // Load currency when authentication state changes or on mount
  // Wait for token to be available if authenticated to avoid race condition
  useEffect(() => {
    if (isAuthenticated && !token) {
      // Token not yet available, wait a bit
      const timeout = setTimeout(() => loadCurrency(), 100);
      return () => clearTimeout(timeout);
    } else {
      // Either not authenticated (will use public endpoint) or token is ready
      loadCurrency();
    }
  }, [isAuthenticated, token, loadCurrency]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="items" element={<ItemList />} />
          <Route path="items/add" element={<AddItem />} />
          <Route path="items/:id" element={<ItemDetail />} />
          <Route path="items/:id/edit" element={<EditItem />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="reading-stats" element={<ReadingStats />} />
          <Route path="user-management" element={<UserManagement />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
