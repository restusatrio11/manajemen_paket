import { useEffect, useState } from 'react';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Package, CalendarClock, TrendingUp, MoreHorizontal, Printer } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid
} from 'recharts';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>({
    total: 0,
    menunggu_diambil: 0,
    sudah_diambil: 0,
    masuk_hari_ini: 0
  });

  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/paket/stats?month=${filterMonth}&year=${filterYear}`);
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [filterMonth, filterYear]);

  const dataMingguan = (stats.tren_harian || []).map((item: any) => ({
    name: new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    value: item.count_masuk
  }));

  const dataTren = (stats.tren_harian || []).map((item: any) => {
    const d = new Date(item.tanggal);
    const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
    return {
      day: dayName,
      current: item.count_masuk,
      taken: item.count_diambil
    };
  });

  const totalEkspedisiCount = (stats.top_ekspedisi || []).reduce((acc: number, curr: any) => acc + curr.count, 0);
  const colors = ['bg-bps-blue', 'bg-orange-400', 'bg-green-500', 'bg-red-500'];
  const topEkspedisiRender = (stats.top_ekspedisi || []).map((item: any, i: number) => {
    const percentage = totalEkspedisiCount === 0 ? 0 : Math.round((item.count / totalEkspedisiCount) * 100);
    return {
      name: `${item.nama || '-'} (${percentage}%)`,
      count: item.count,
      color: colors[i % colors.length]
    }
  });

  if (loading) {
    return <LoadingSpinner text="Memuat Analitik Dasbor..." fullScreen />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Dashboard Analitik Paket</h1>
          <p className="text-sm text-slate-500">Tinjauan statistik lalu lintas paket masuk untuk staf BPS.</p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <input 
            type="month" 
            className="bg-white border border-slate-300 text-sm font-medium px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-bps-blue"
            value={`${filterYear}-${String(filterMonth).padStart(2, '0')}`}
            onChange={(e) => {
              if (e.target.value) {
                const [y, m] = e.target.value.split('-');
                setFilterYear(Number(y));
                setFilterMonth(Number(m));
              }
            }}
          />
          <button 
            onClick={() => window.print()} 
            className="bg-bps-blue text-white text-sm font-medium px-4 py-2 rounded-md flex items-center gap-2 hover:bg-bps-dark transition-colors"
          >
            <Printer size={16} /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
             <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">Total Keseluruhan Paket</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-3xl font-bold tracking-tighter">
                      {loading ? '...' : stats.total}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400">Total data paket terekam</p>
                </div>
                <div className="text-bps-blue opacity-80"><Package size={24} /></div>
             </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
             <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">Paket Masuk Hari Ini</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-3xl font-bold tracking-tighter">
                      {loading ? '...' : stats.masuk_hari_ini}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400">Paket yang dicatat hari ini</p>
                </div>
                <div className="text-orange-500 opacity-80"><CalendarClock size={24} /></div>
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
             <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">Menunggu Diambil</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-3xl font-bold tracking-tighter">
                      {loading ? '...' : stats.menunggu_diambil}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 text-yellow-600">Belum diserahkan ke pemilik</p>
                </div>
                <div className="text-yellow-500 opacity-80"><TrendingUp size={24} /></div>
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
             <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">Sudah Selesai/Diambil</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-3xl font-bold tracking-tighter text-green-700">
                      {loading ? '...' : stats.sudah_diambil}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 text-green-600">Terdistribusi ke penerima</p>
                </div>
                <div className="text-green-500 opacity-80"><Package size={24} /></div>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-200">
          <CardHeader className="p-6 pb-2 mb-2">
             <div className="flex justify-between items-center">
               <CardTitle className="text-lg">Jumlah Paket Masuk (Bulan Ini)</CardTitle>
               <button className="text-slate-400 hover:text-slate-600 print:hidden"><MoreHorizontal size={20}/></button>
             </div>
          </CardHeader>
          <CardContent className="p-6 pt-0 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataMingguan}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar 
                  dataKey="value" 
                  fill="#7fb5e5" 
                  radius={[4, 4, 0, 0]}
                  barSize={80}
                  activeBar={{ fill: '#0b5ed7' }} 
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Expeditions */}
        <Card className="col-span-1 shadow-sm border-slate-200">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-lg">Ekspedisi Terbanyak</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-8 flex flex-col items-center justify-center">
             <div className="text-center mb-8 relative">
                <div className="w-32 h-32 rounded-full border-[16px] border-bps-blue border-r-orange-400 border-b-green-500 border-l-red-500 rotate-45 mx-auto opacity-90 relative">
                   <div className="absolute inset-0 bg-white rounded-full m-[-8px]"></div>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-slate-800">Top {stats.top_ekspedisi?.length || 0}</span>
                  <span className="text-xs text-slate-500">Ekspedisi</span>
                </div>
             </div>
             
             <div className="w-full space-y-3 mt-4">
                {topEkspedisiRender.map((item: any) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.color}`}></div>
                      <span className="text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">{item.count}</span>
                  </div>
                ))}
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tren Waktu Line Chart */}
        <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-200">
            <CardHeader className="p-6 pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Tren Masuk vs Diambil (Bulan Ini)</CardTitle>
                <p className="text-sm text-slate-500 font-normal mt-1">Perbandingan paket masuk dan pengambilannya per hari.</p>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-4 h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataTren} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip cursor={{stroke: '#cbd5e1', strokeWidth: 1}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  
                  {/* Current week lines */}
                  <Line type="monotone" name="Paket Masuk" dataKey="current" stroke="#0b5ed7" strokeWidth={3} dot={{r: 4, fill: '#0b5ed7', strokeWidth: 0}} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Paket Diambil" dataKey="taken" stroke="#22c55e" strokeWidth={3} dot={{r: 4, fill: '#22c55e', strokeWidth: 0}} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
        </Card>

        {/* Top 5 Pegawai */}
        <Card className="col-span-1 shadow-sm border-slate-200">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-lg">Duta M-A-L (Top 5 Penerima Paket)</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-4 h-[250px] overflow-y-auto">
             <div className="space-y-4">
                {(stats.top_pegawai || []).map((peg: any) => (
                  <div key={peg.nip} className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                       {peg.foto ? (
                         <img src={peg.foto} alt={peg.nama} className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-sm">
                           {peg.nama.substring(0, 2).toUpperCase()}
                         </div>
                       )}
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{peg.nama}</p>
                        <p className="text-xs text-slate-500 truncate">{peg.nip}</p>
                     </div>
                     <div className="bg-bps-blue/10 text-bps-blue px-2 py-1 rounded-md text-xs font-bold">
                        {peg.count} Box
                     </div>
                  </div>
                ))}
                {(!stats.top_pegawai || stats.top_pegawai.length === 0) && (
                   <div className="text-center text-slate-400 text-sm mt-8">Belum ada data</div>
                )}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
