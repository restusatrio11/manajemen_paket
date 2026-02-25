import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  Search, Plus, 
  ChevronLeft, ChevronRight, Download, X,
  AlertCircle, PackageSearch, Edit2
} from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const EmployeeInfoCell = ({ nip }: { nip: string }) => {
  const [data, setData] = useState<any>(null);
  
  useEffect(() => {
    if (!nip) return;
    api.get(`/master/pegawai?q=${nip}`).then(res => {
      if (res.data.success && res.data.data.length > 0) {
        const match = res.data.data.find((p:any) => p.nip === nip) || res.data.data[0];
        setData(match);
      }
    }).catch(() => {});
  }, [nip]);

  if (!data) {
     return (
        <div className="flex items-center gap-3 w-48">
           <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse"></div>
           <div className="space-y-1">
             <div className="h-3 w-24 bg-slate-200 animate-pulse rounded"></div>
             <div className="h-2 w-16 bg-slate-200 animate-pulse rounded"></div>
           </div>
        </div>
     );
  }

  return (
    <div className="flex items-center gap-3">
       <div className="relative">
         {data.foto ? (
           <img src={data.foto} alt={data.nama} className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 bg-white" />
         ) : (
           <div className="w-8 h-8 rounded-full bg-bps-blue/10 text-bps-blue font-bold flex items-center justify-center shrink-0 border border-bps-blue/20">
             {data.nama.substring(0, 1).toUpperCase()}
           </div>
         )}
       </div>
       <div className="flex flex-col">
         <span className="font-semibold text-sm text-slate-800 line-clamp-1">{data.nama}</span>
         <span className="text-xs text-slate-500 font-mono">{nip}</span>
       </div>
    </div>
  );
};

const EmployeeDetailInfo = ({ nip }: { nip: string }) => {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    if (!nip) return;
    api.get(`/master/pegawai?q=${nip}`).then(res => {
       if (res.data.success && res.data.data.length > 0) {
          setData(res.data.data.find((p:any) => p.nip === nip) || res.data.data[0]);
       }
    }).catch(() => {});
  }, [nip]);

  return (
    <div className="p-3 bg-slate-50 rounded-lg border">
      <p className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">Tujuan Penerima</p>
      {data ? (
        <>
          <p className="font-medium text-slate-800 text-base">{data.nama}</p>
          <p className="text-slate-500 font-mono mt-1">{nip}</p>
        </>
      ) : (
        <>
          <div className="h-4 w-32 bg-slate-200 animate-pulse rounded mb-2"></div>
          <div className="h-3 w-24 bg-slate-200 animate-pulse rounded"></div>
        </>
      )}
    </div>
  );
};

export default function PaketMasukList() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Fitur filter
  const [status, setStatus] = useState<string>('semua');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [ekspedisiList, setEkspedisiList] = useState<any[]>([]);
  const [platformList, setPlatformList] = useState<any[]>([]);
  const [ekspedisiFilter, setEkspedisiFilter] = useState<string>('semua');
  
  const [detailModal, setDetailModal] = useState<any>(null);
  
  // States for Edit Modal
  const [editModal, setEditModal] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editPegawaiQuery, setEditPegawaiQuery] = useState('');
  const [editPegawaiResults, setEditPegawaiResults] = useState<any[]>([]);
  const [showEditDropdown, setShowEditDropdown] = useState(false);
  const editDropdownRef = useRef<HTMLDivElement>(null);

  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, action: 'ambil' | 'delete', id: number | null, title: string, message: string}>({ isOpen: false, action: 'ambil', id: null, title: '', message: '' });

  useEffect(() => {
    // Fetch master ekspedisi & platform
    Promise.all([
      api.get('/master/ekspedisi'),
      api.get('/master/platform')
    ]).then(([resEks, resPlat]) => {
      if (resEks.data.success) setEkspedisiList(resEks.data.data);
      if (resPlat.data.success) setPlatformList(resPlat.data.data);
    }).catch(console.error);

    const handleClickOutside = (event: MouseEvent) => {
      if (editDropdownRef.current && !editDropdownRef.current.contains(event.target as Node)) {
        setShowEditDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (editPegawaiQuery.trim().length > 2 && editModal && !editModal.changed_nip) {
        api.get(`/master/pegawai?q=${editPegawaiQuery}`)
           .then(res => {
              setEditPegawaiResults(res.data.data);
              setShowEditDropdown(true);
           });
      } else if (!editModal?.changed_nip) {
        setEditPegawaiResults([]);
        setShowEditDropdown(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [editPegawaiQuery, editModal?.changed_nip]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (status !== 'semua') params.status = status;
      if (debouncedSearch) params.search = debouncedSearch;
      if (ekspedisiFilter !== 'semua') params.ekspedisi_id = ekspedisiFilter;
      
      const res = await api.get('/paket', { params });
      if (res.data.success) {
        setData(res.data.data);
        setTotalPages(res.data.meta.totalPages);
      }
    } catch (error) {
      console.error("Gagal load paket", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [page, status, debouncedSearch, ekspedisiFilter]);

  const confirmAmbil = (id: number) => {
    setConfirmModal({
      isOpen: true,
      action: 'ambil',
      id,
      title: 'Konfirmasi Pengambilan',
      message: 'Apakah Anda yakin paket ini sudah diambil oleh penerima?'
    });
  };

  const confirmDelete = (id: number) => {
    setConfirmModal({
      isOpen: true,
      action: 'delete',
      id,
      title: 'Hapus Paket',
      message: 'Apakah Anda yakin ingin menghapus catatan paket ini? Tindakan ini tidak dapat dibatalkan.'
    });
  };

  const handleModalConfirm = async () => {
    if (!confirmModal.id) return;
    try {
      if (confirmModal.action === 'ambil') {
        await api.put(`/paket/${confirmModal.id}/ambil`);
        toast.success('Paket berhasil ditandai sebagai diambil');
      } else if (confirmModal.action === 'delete') {
        await api.delete(`/paket/${confirmModal.id}`);
        toast.success('Paket berhasil dihapus');
      }
      setConfirmModal({ ...confirmModal, isOpen: false });
      fetchPackages(); // Reload
    } catch (error) {
       toast.error(`Gagal ${confirmModal.action === 'ambil' ? 'memperbarui status' : 'menghapus'} paket`);
    }
  };

  const openEditModal = (item: any) => {
    setEditModal({
      id: item.id,
      ekspedisi_id: item.ekspedisi_id || '',
      platform_id: item.platform_id || '',
      nip_pegawai: item.nip_pegawai || '',
      changed_nip: item.nip_pegawai || ''
    });
    setEditPegawaiQuery(item.nip_pegawai);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!editModal.ekspedisi_id || !editModal.platform_id || !editModal.changed_nip) {
        return toast.error("Harap lengkapi kurir, platform, dan karyawan penerima.");
     }
     
     setEditLoading(true);
     try {
        await api.put(`/paket/${editModal.id}`, {
           ekspedisi_id: editModal.ekspedisi_id,
           platform_id: editModal.platform_id,
           nip_pegawai: editModal.changed_nip
        });
        toast.success("Berhasil memperbarui data paket");
        setEditModal(null);
        fetchPackages();
     } catch (err: any) {
        toast.error("Gagal memperbarui paket: " + (err.response?.data?.message || err.message));
     } finally {
        setEditLoading(false);
     }
  };

  const handleExport = () => {
    if (data.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }
    
    const headers = ['ID Pelacakan', 'NIP Penerima', 'Nama Petugas Resepsionis', 'Waktu Diterima', 'Ekspedisi', 'Platform', 'Status'];
    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        `PKG-${item.id.toString().padStart(6, '0')}`,
        item.nip_pegawai,
        `"${item.nama_petugas || ''}"`,
        `"${formatDate(item.waktu_diterima)}"`,
        item.nama_ekspedisi || 'Tanpa Kurir',
        item.nama_platform || 'Tanpa Platform',
        item.status === 'sudah_diambil' ? 'Diambil' : 'Menunggu'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Daftar_Paket_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Data berhasil diekspor ke CSV');
  };

  if (loading) {
    return <LoadingSpinner text="Memuat Data Paket..." fullScreen />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Daftar Paket Masuk</h1>
          <p className="text-sm text-slate-500">Kelola dan pantau seluruh paket yang diterima oleh resepsionis.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 text-slate-600" onClick={handleExport}>
            <Download size={16} /> Ekspor Data
          </Button>
          <Link to="/paket-masuk/baru">
            <Button className="gap-2">
              <Plus size={16} /> Registrasi Paket
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {/* Toolbar & Filters */}
          <div className="p-4 border-b flex flex-col sm:flex-row justify-between gap-4 bg-slate-50/50 rounded-t-xl">
            <div className="flex gap-2">
              {['semua', 'menunggu_diambil', 'sudah_diambil'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => { setStatus(tab); setPage(1); }}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    status === tab 
                    ? 'bg-white shadow-sm text-bps-blue border border-slate-200' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {tab === 'semua' ? 'Semua Paket' : tab === 'menunggu_diambil' ? 'Menunggu' : 'Diambil'}
                </button>
              ))}
            </div>
            
             <div className="flex items-center gap-2">
               <select
                 value={ekspedisiFilter}
                 onChange={(e) => { setEkspedisiFilter(e.target.value); setPage(1); }}
                 className="bg-white border rounded-md px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-bps-blue custom-select appearance-none max-w-[150px]"
                 // Added custom-select for background chevron if needed, or rely on browser default since we don't have lucide chevron on select easily without wrapper
               >
                 <option value="semua">Semua Ekspedisi</option>
                 {ekspedisiList.map(eks => (
                   <option key={eks.id} value={eks.id}>{eks.nama_ekspedisi}</option>
                 ))}
               </select>
               <div className="relative w-64">
                 <Input 
                   icon={Search} 
                   placeholder="Cari resi / nama / NIP" 
                   value={search}
                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                   className="bg-white"
                 />
               </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b uppercase text-xs">
                <tr>
                  <th className="px-6 py-4">ID Pelacakan</th>
                  <th className="px-6 py-4">Penerima</th>
                  <th className="px-6 py-4">Waktu Diterima</th>
                  <th className="px-6 py-4">Layanan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.length === 0 ? (
                   <tr><td colSpan={6} className="text-center py-10 text-slate-500">Tidak ada paket ditemukan</td></tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-slate-700">PKG-{item.id.toString().padStart(6, '0')}</td>
                      <td className="px-6 py-4">
                         <EmployeeInfoCell nip={item.nip_pegawai} />
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                         {formatDate(item.waktu_diterima)}
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2">
                           {/* Using master data join from backend */}
                           <span className="font-medium text-slate-800">{item.nama_ekspedisi || '-'}</span>
                           <span className="text-slate-400 text-xs px-2 py-0.5 bg-slate-100 rounded-full">{item.nama_platform || '-'}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                        {item.status === 'sudah_diambil' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Diambil
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> Menunggu
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex justify-end gap-2">
                           {item.status === 'menunggu_diambil' && (
                             <Button 
                               size="sm" 
                               onClick={() => confirmAmbil(item.id)}
                               className="bg-green-600 hover:bg-green-700"
                              >
                               Diambil
                             </Button>
                           )}
                           <Button variant="outline" size="sm" onClick={() => setDetailModal(item)} className="text-bps-blue border-bps-blue/30 hover:bg-bps-light">Detail</Button>
                           <Button variant="outline" size="sm" onClick={() => openEditModal(item)} className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300">Edit</Button>
                           <Button variant="outline" size="sm" onClick={() => confirmDelete(item.id)} className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300">Hapus</Button>
                         </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t flex items-center justify-between text-sm text-slate-500">
             <span>Menampilkan hasil <strong>{data.length}</strong> dari total records</span>
             
             <div className="flex items-center gap-1">
               <Button 
                 variant="outline" 
                 size="icon" 
                 className="h-8 w-8"
                 onClick={() => setPage(p => Math.max(1, p - 1))}
                 disabled={page === 1}
               >
                 <ChevronLeft size={14} />
               </Button>
               {Array.from({length: totalPages}, (_, i) => i + 1).map(pageNum => (
                  <Button 
                    key={pageNum}
                    variant={pageNum === page ? "default" : "ghost"} 
                    className={`h-8 w-8 ${pageNum !== page ? 'text-slate-600 hover:bg-slate-100' : ''}`}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
               ))}
               <Button 
                 variant="outline" 
                 size="icon" 
                 className="h-8 w-8"
                 onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                 disabled={page === totalPages}
               >
                 <ChevronRight size={14} />
               </Button>
             </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
             <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                <h3 className="font-semibold text-lg text-slate-800">Detail Paket PKG-{detailModal.id.toString().padStart(6, '0')}</h3>
                <Button variant="ghost" size="icon" onClick={() => setDetailModal(null)} className="h-8 w-8 text-slate-500 hover:text-red-500">
                   <X size={18} />
                </Button>
             </div>
             <div className="p-6 overflow-y-auto space-y-6">
                <div className="flex gap-4 flex-col sm:flex-row items-center sm:items-start">
                   {detailModal.foto_paket_url ? (
                       <div className="w-full sm:w-1/3 shrink-0 relative aspect-[3/4] bg-slate-100 rounded-md overflow-hidden border">
                           <img src={`http://localhost:3000${detailModal.foto_paket_url.replace('/public', '')}`} alt="Foto Paket" className="w-full h-full object-cover" />
                       </div>
                   ) : (
                       <div className="w-full sm:w-1/3 shrink-0 relative aspect-[3/4] bg-slate-100 flex items-center justify-center rounded-md overflow-hidden border border-dashed border-slate-300">
                           <span className="text-slate-400 text-sm">Tidak ada foto</span>
                       </div>
                   )}
                   <div className="flex-1 w-full space-y-4 text-sm mt-4 sm:mt-0">
                      <EmployeeDetailInfo nip={detailModal.nip_pegawai} />
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <p className="text-slate-500 text-xs font-semibold mb-1">Kurir / Ekspedisi</p>
                            <p className="font-medium text-slate-800">{detailModal.nama_ekspedisi || 'Tanpa Kurir'}</p>
                         </div>
                         <div>
                            <p className="text-slate-500 text-xs font-semibold mb-1">Platform</p>
                            <p className="font-medium text-slate-800">{detailModal.nama_platform || 'Tanpa Platform'}</p>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                         <div>
                            <p className="text-slate-500 text-xs font-semibold mb-1">Diterima pada</p>
                            <p className="text-slate-800">{formatDate(detailModal.waktu_diterima)}</p>
                         </div>
                         <div>
                            <p className="text-slate-500 text-xs font-semibold mb-1">Status</p>
                            {detailModal.status === 'sudah_diambil' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 font-mono">
                                    Diambil {formatDate(detailModal.waktu_diambil)}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                    Menunggu
                                </span>
                            )}
                         </div>
                      </div>
                   </div>
                </div>
             </div>
             <div className="p-4 border-t bg-slate-50 flex justify-end">
                <Button onClick={() => setDetailModal(null)} className="w-24">Tutup</Button>
             </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
             <div className="p-4 border-b">
                <h3 className="font-semibold text-lg text-slate-800">{confirmModal.title}</h3>
             </div>
             <div className="p-4 text-slate-600">
                <p>{confirmModal.message}</p>
             </div>
             <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                <Button variant="outline" className="text-slate-600" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>Batal</Button>
                <Button 
                  className={confirmModal.action === 'ambil' ? 'bg-green-600 hover:bg-green-700 text-white border-0' : 'bg-red-600 hover:bg-red-700 text-white border-0'}
                  onClick={handleModalConfirm}
                >
                  {confirmModal.action === 'delete' ? 'Ya, Hapus' : 'Ya, Diambil'}
                </Button>
             </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
             <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                <h3 className="font-semibold text-lg text-slate-800">Ubah Data Paket PKG-{detailModal?.id ? detailModal.id.toString().padStart(6, '0') : ''}</h3>
                <Button variant="ghost" size="icon" onClick={() => setEditModal(null)} className="h-8 w-8 text-slate-500 hover:text-red-500">
                   <X size={18} />
                </Button>
             </div>
             <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 overflow-visible">
               <div className="p-6 space-y-5 flex-1 overflow-y-visible">
                  
                  <div className="space-y-1.5" ref={editDropdownRef as any}>
                     <label className="text-sm font-semibold text-slate-700">Penerima (NIP / Nama)</label>
                     <div className="flex gap-2 relative">
                        <Input 
                          icon={PackageSearch} 
                          placeholder="Ketik min 3 huruf (NIP/Nama)..." 
                          className={`w-full ${editModal.changed_nip ? 'ring-2 ring-green-500/20 border-green-500 bg-green-50/50' : ''}`}
                          value={editPegawaiQuery}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                             setEditPegawaiQuery(e.target.value);
                             if (editModal.changed_nip) setEditModal({ ...editModal, changed_nip: '' });
                          }}
                          onFocus={() => {
                            if (editPegawaiResults.length > 0 && !editModal.changed_nip) setShowEditDropdown(true);
                          }}
                        />
                        {editModal.changed_nip && (
                           <Button type="button" variant="ghost" size="icon" className="shrink-0 text-slate-400 hover:text-red-500 absolute right-2 top-1/2 -translate-y-1/2" onClick={() => {
                              setEditModal({ ...editModal, changed_nip: '' });
                              setEditPegawaiQuery('');
                              setEditPegawaiResults([]);
                           }}>
                             <X size={18} />
                           </Button>
                        )}
                     </div>

                     {showEditDropdown && (
                       <div className="absolute z-50 mt-1 w-[calc(100%-48px)] bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {editPegawaiResults.length === 0 ? (
                             <div className="p-3 text-sm text-slate-500 text-center">
                                {editPegawaiQuery.length > 2 ? 'Pencarian tidak menemukan hasil...' : 'Ketik untuk mencari...'}
                             </div>
                          ) : (
                            editPegawaiResults.map(p => (
                               <div 
                                  key={p.nip} 
                                  className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-0"
                                  onClick={() => {
                                     setEditModal({ ...editModal, changed_nip: p.nip });
                                     setEditPegawaiQuery(`${p.nip} - ${p.nama}`);
                                     setShowEditDropdown(false);
                                  }}
                               >
                                  <div className="font-medium text-slate-800 text-sm">{p.nama}</div>
                                  <div className="text-xs text-slate-500 mt-0.5">{p.nip} • {p.jabatan}</div>
                               </div>
                            ))
                          )}
                       </div>
                     )}
                     
                     {editModal.changed_nip && (
                        <p className="text-xs text-green-600 font-medium mt-1.5 inline-flex items-center gap-1">
                           <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Terpilih: {editModal.changed_nip}
                        </p>
                     )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Ekspedisi / Kurir</label>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={editModal.ekspedisi_id}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditModal({ ...editModal, ekspedisi_id: e.target.value })}
                        >
                           <option value="">Pilih kurir...</option>
                           {ekspedisiList.map(eksp => <option key={eksp.id} value={eksp.id}>{eksp.nama_ekspedisi}</option>)}
                        </select>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Platform Asal</label>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={editModal.platform_id}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditModal({ ...editModal, platform_id: e.target.value })}
                        >
                           <option value="">Pilih platform...</option>
                           {platformList.map(p => <option key={p.id} value={p.id}>{p.nama_platform}</option>)}
                        </select>
                      </div>
                  </div>
               </div>
               
               <div className="p-4 border-t bg-slate-50 flex justify-end gap-3 mt-auto">
                  <Button type="button" variant="outline" className="text-slate-600" onClick={() => setEditModal(null)}>Batal</Button>
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white" disabled={editLoading}>
                     {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
               </div>
             </form>
          </div>
        </div>
      )}


    </div>
  );
}
