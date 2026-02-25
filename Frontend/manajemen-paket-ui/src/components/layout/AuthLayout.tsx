import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Package } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Memuat Aplikasi..." />;
  }

  // Jika sudah login, lempar ke dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Kolom Kiri - Form */}
      <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-24 bg-white">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-bps-blue p-2 rounded-lg text-white">
            <Package size={24} />
          </div>
          <div>
            <h1 className="font-bold text-bps-blue text-lg leading-tight">Sistem Paket</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Badan Pusat Statistik</p>
          </div>
        </div>
        
        <Outlet />

        <div className="mt-auto pt-16">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Badan Pusat Statistik. Hak Cipta Dilindungi Undang-Undang.
          </p>
        </div>
      </div>

      {/* Kolom Kanan - Ilustrasi (Sembunyi.di mobile) */}
      <div className="hidden lg:flex bg-slate-50 flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Dekorasi blur background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-bps-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-bps-blue/10 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4"></div>
        
        <div className="z-10 text-center max-w-md">
          {/* Ilustrasi Kotak Placeholder */}
          <div className="bg-white rounded-2xl shadow-xl border p-12 mb-8 relative rotate-[-2deg] mx-auto w-64 h-64 flex items-center justify-center">
             <div className="absolute -top-4 left-4 bg-white shadow-md border rounded-md px-3 py-1 flex items-center gap-2 text-sm font-medium z-20 rotate-[2deg]">
                <span className="text-orange-500">🔔</span> Notifikasi Real-time
             </div>
             
             <Package size={100} className="text-bps-blue opacity-90" />
             
             <div className="absolute -bottom-4 right-4 bg-white shadow-md border rounded-md px-3 py-1 flex items-center gap-2 text-sm font-medium z-20 rotate-[2deg]">
                <span className="text-green-500">✅</span> Aman & Terpercaya
             </div>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Manajemen Logistik Terintegrasi</h2>
          <p className="text-slate-500 text-lg">
            Sistem pemantauan paket masuk dan keluar untuk keamanan dan efisiensi operasional kantor BPS.
          </p>
        </div>
      </div>
    </div>
  );
}
