import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    document.body.style.cursor = 'wait';
    setLoading(true);

    try {
      const res = await api.post('/auth/login', formData);
      if (res.data.success) {
        login(res.data.data.token, res.data.data.user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan saat login. Periksa koneksi backend.');
    } finally {
      document.body.style.cursor = 'default';
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full">
      {/* <img src="/logo.png" alt="Logo Paket BPS" className="w-20 md:w-24 mb-6 drop-shadow-sm" /> */}
      <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Selamat Datang</h2>
      <p className="text-slate-500 mb-8">
        Silakan masuk untuk mengakses dashboard manajemen paket.
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6 text-sm border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">NIP atau Username</label>
          <Input 
            icon={User}
            name="username"
            placeholder="Masukkan NIP atau username Anda"
            value={formData.username}
            onChange={e => setFormData({ ...formData, username: e.target.value })}
            required
            autoComplete="username"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
             <label className="text-sm font-semibold text-slate-700">Kata Sandi</label>
             <a href="#" className="text-xs text-bps-blue hover:underline font-medium">Lupa kata sandi?</a>
          </div>
          
          <div className="relative">
             <Input 
               icon={Lock}
               type={showPassword ? "text" : "password"}
               name="password"
               placeholder="••••••••"
               value={formData.password}
               onChange={e => setFormData({ ...formData, password: e.target.value })}
               required
               autoComplete="current-password"
             />
             <button 
               type="button" 
               className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
               onClick={() => setShowPassword(!showPassword)}
             >
               {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
             </button>
          </div>
        </div>

        <div className="flex items-center pt-2">
            <input type="checkbox" id="remember" className="rounded border-slate-300 text-bps-blue focus:ring-bps-blue" />
            <label htmlFor="remember" className="ml-2 text-sm text-slate-600">Ingat saya di perangkat ini</label>
        </div>

        <Button 
          type="submit" 
          className="w-full text-base py-6 font-semibold" 
          disabled={loading}
        >
          {loading ? 'Memeriksa kredensial...' : 'Masuk ke Sistem →'}
        </Button>

        <div className="mt-8 flex items-center justify-center">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="px-4 text-xs text-slate-400 whitespace-nowrap bg-white">Hanya untuk Petugas Keamanan</span>
            <div className="border-t border-slate-200 w-full"></div>
        </div>
      </form>
    </div>
  );
}
