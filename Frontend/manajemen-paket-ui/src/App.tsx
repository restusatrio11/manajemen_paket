import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import AuthLayout from './components/layout/AuthLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import PaketMasukList from './pages/paket/PaketListPage';
import FormPaketPage from './pages/paket/FormPaketPage';
import MasterEkspedisiPage from './pages/master/MasterEkspedisiPage';
import MasterPlatformPage from './pages/master/MasterPlatformPage';
import UserListPage from './pages/master/UserListPage';

function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          {/* Public Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/paket-masuk" element={<PaketMasukList />} />
            <Route path="/paket-masuk/baru" element={<FormPaketPage />} />
            <Route path="/master/ekspedisi" element={<MasterEkspedisiPage />} />
            <Route path="/master/platform" element={<MasterPlatformPage />} />
            <Route path="/master/users" element={<UserListPage />} />
          </Route>

          {/* Fallback Catch-all Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </>
  );
}

export default App;
