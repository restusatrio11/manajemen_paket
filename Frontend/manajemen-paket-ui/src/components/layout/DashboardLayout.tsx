import { useState } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Inbox, 
  Settings, 
  LogOut,
  Bell,
  Package,
  Truck,
  Building2,
  Users,
  X,
  UserCircle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function DashboardLayout() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profil' | 'tentang'>('profil');

  if (loading) {
    return <LoadingSpinner text="Memuat..." fullScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const navGroups = [
    {
      title: 'Utama',
      items: [
        { text: 'Dasbor', icon: LayoutDashboard, path: '/dashboard' },
      ]
    },
    {
      title: 'Manajemen Paket',
      items: [
        { text: 'Paket Masuk', icon: Inbox, path: '/paket-masuk' },
      ]
    },
    {
      title: 'Master Data',
      items: [
        { text: 'Ekspedisi (Layanan)', icon: Truck, path: '/master/ekspedisi' },
        { text: 'Platform (Asal)', icon: Building2, path: '/master/platform' },
        { text: 'Pengguna', icon: Users, path: '/master/users' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Kiri */}
      <aside className="w-64 bg-white border-r flex flex-col hidden md:flex sticky top-0 h-screen print:hidden">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 object-contain mr-1">
            <img src="/logo.png" alt="Paket Wak Logo" className="w-full h-full" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800">Paket Wak</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Admin Keamanan</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto overflow-x-hidden">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                {group.title}
              </p>
              {group.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    location.pathname.startsWith(item.path) && item.path !== '/dashboard' 
                      ? "bg-bps-light text-bps-blue" 
                      : location.pathname === item.path 
                        ? "bg-bps-light text-bps-blue"
                        : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <item.icon size={18} />
                  {item.text}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t space-y-1">
          <Button variant="ghost" className="w-full justify-start text-slate-600" onClick={() => setIsSettingsOpen(true)}>
            <Settings size={18} className="mr-3" />
            Pengaturan
          </Button>
          <div className="flex items-center gap-3 p-3 mt-2 rounded-md hover:bg-slate-50">
             <div className="w-8 h-8 rounded-full bg-orange-200 border border-orange-300 flex items-center justify-center text-orange-700 font-bold shrink-0">
               {user.nama_lengkap.charAt(0)}
             </div>
             <div className="flex-1 overflow-hidden">
               <p className="text-sm font-medium text-slate-800 truncate">{user.nama_lengkap}</p>
               <button onClick={logout} className="text-xs text-muted-foreground hover:text-red-600 flex items-center gap-1">
                 Keluar <LogOut size={10} />
               </button>
             </div>
          </div>
        </div>
      </aside>

      {/* Area Konten Utama */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 z-10 sticky top-0 print:hidden">
           {/* Space reserved for future header items if needed, previously contained search */}
           <div className="flex-1 max-w-xl hidden md:block"></div>
          <div className="flex items-center gap-4 ml-auto">
             <button className="relative p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors">
               <Bell size={20} />
               <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
             </button>
             {/* Mobile menu toggle (optional feature) */}
          </div>
        </header>

        {/* Scrollable Container Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
           <Outlet />
        </div>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row h-[500px] max-h-[80vh]">
            
            {/* Sidebar Modal */}
            <div className="w-full md:w-48 bg-slate-50 border-r flex flex-col p-4 gap-2 shrink-0">
               <h3 className="font-bold text-slate-800 mb-2 px-2">Pengaturan</h3>
               <button 
                 onClick={() => setSettingsTab('profil')}
                 className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${settingsTab === 'profil' ? 'bg-bps-blue text-white' : 'text-slate-600 hover:bg-slate-200'}`}
               >
                 <UserCircle size={16} /> Profil
               </button>
               <button 
                 onClick={() => setSettingsTab('tentang')}
                 className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${settingsTab === 'tentang' ? 'bg-bps-blue text-white' : 'text-slate-600 hover:bg-slate-200'}`}
               >
                 <Info size={16} /> Tentang Sistem
               </button>
            </div>

            {/* Content Modal */}
            <div className="flex-1 flex flex-col h-full bg-white relative">
               <div className="absolute top-4 right-4">
                 <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-red-500 bg-slate-100 hover:bg-red-50 p-1.5 rounded-md transition-colors">
                    <X size={18} />
                 </button>
               </div>

               <div className="p-8 overflow-y-auto flex-1">
                 {settingsTab === 'profil' && (
                   <div className="space-y-6">
                     <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Profil Pengguna</h2>
                     <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 text-2xl font-bold">
                          {user.nama_lengkap.charAt(0)}
                        </div>
                        <div>
                           <h3 className="font-bold text-lg text-slate-800">{user.nama_lengkap}</h3>
                           <p className="text-slate-500 capitalize">{user.role}</p>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <div>
                           <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Username / NIP</label>
                           <p className="text-slate-800 font-medium">{user.username}</p>
                        </div>
                        <div>
                           <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hak Akses</label>
                           <p className="text-slate-800 font-medium">{user.role === 'admin' ? 'Administrator Sistem' : 'Petugas Keamanan (Satpam)'}</p>
                        </div>
                     </div>
                   </div>
                 )}

                 {settingsTab === 'tentang' && (
                   <div className="space-y-6 text-center sm:text-left">
                     <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Tentang Sistem</h2>
                     <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mt-6">
                        <div className="w-24 h-24 bg-bps-light text-bps-blue rounded-2xl flex items-center justify-center shrink-0 border border-bps-blue/20">
                          <Package size={48} />
                        </div>
                        <div className="space-y-2">
                           <h3 className="text-2xl font-bold text-slate-800">Aplikasi Manajemen Paket</h3>
                           <p className="text-slate-600">BPS Provinsi Sumatera Utara (BPS)</p>
                           <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full text-xs font-semibold text-slate-600">
                              <span>Versi 1.0.0</span>
                              <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                              <span>Build 2026.02</span>
                           </div>
                        </div>
                     </div>
                     <div className="space-y-2 pt-4">
                        <p className="text-sm text-slate-600">
                           Sistem ini dirancang untuk mempermudah pencatatan, pemantauan, dan manajemen lalu lintas penerimaan paket di lingkungan kerja BPS Provinsi Sumatera Utara. Dibuat khusus untuk mendukung kinerja petugas keamanan dan efisiensi pelaporan logistik.
                        </p>
                        <p className="text-sm text-slate-500 font-medium">
                           © 2026 BPS Provinsi Sumatera Utara. Hak Cipta Dilindungi.
                        </p>
                     </div>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
