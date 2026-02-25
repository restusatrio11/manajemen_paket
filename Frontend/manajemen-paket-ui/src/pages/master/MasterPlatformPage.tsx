import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Search, Plus, Edit, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function MasterPlatformPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'tambah' | 'edit'>('tambah');
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ nama_platform: '', is_active: true });

  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, id: number | null, nama: string}>({isOpen: false, id: null, nama: ''});

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/master/platform');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      toast.error('Gagal mengambil data platform');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = data.filter(item => 
    item.nama_platform.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return <LoadingSpinner text="Memuat Data Platform..." fullScreen />;
  }

  const openTambahModal = () => {
    setModalMode('tambah');
    setFormData({ nama_platform: '', is_active: true });
    setEditId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setModalMode('edit');
    setFormData({ nama_platform: item.nama_platform, is_active: item.is_active });
    setEditId(item.id);
    setIsModalOpen(true);
  };

  const confirmDelete = (item: any) => {
    setConfirmModal({
      isOpen: true,
      id: item.id,
      nama: item.nama_platform
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_platform.trim()) return toast.error('Nama platform wajib diisi');

    try {
      if (modalMode === 'tambah') {
        await api.post('/master/platform', formData);
        toast.success('Platform berhasil ditambahkan');
      } else {
        await api.put(`/master/platform/${editId}`, formData);
        toast.success('Platform berhasil diperbarui');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan platform');
    }
  };

  const handleDelete = async () => {
    if (!confirmModal.id) return;
    try {
      await api.delete(`/master/platform/${confirmModal.id}`);
      toast.success('Platform berhasil dihapus');
      setConfirmModal({ isOpen: false, id: null, nama: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menghapus platform');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Master Platform</h1>
          <p className="text-sm text-slate-500">Kelola daftar platform e-commerce / asal barang.</p>
        </div>
        <Button className="gap-2 shrink-0" onClick={openTambahModal}>
          <Plus size={16} /> Tambah Platform
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50/50 rounded-t-xl">
            <div className="relative w-full max-w-sm">
              <Input 
                icon={Search} 
                placeholder="Cari nama platform..." 
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 w-16 text-center">No</th>
                  <th className="px-6 py-4">Nama Platform</th>
                  <th className="px-6 py-4">Status Aktif</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-10 text-slate-500">Tidak ada data platform</td></tr>
                ) : (
                  currentData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-center font-medium text-slate-600">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{item.nama_platform}</td>
                      <td className="px-6 py-4">
                        {item.is_active ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Aktif</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Nonaktif</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditModal(item)} className="text-bps-blue border-bps-blue/30 hover:bg-bps-light"><Edit size={14} className="mr-1" /> Edit</Button>
                          <Button variant="outline" size="sm" onClick={() => confirmDelete(item)} className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"><Trash2 size={14} className="mr-1" /> Hapus</Button>
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
             <span>Menampilkan <strong>{currentData.length}</strong> dari <strong>{filteredData.length}</strong> platform</span>
             
             <div className="flex items-center gap-1">
               <Button 
                 variant="outline" 
                 size="icon" 
                 className="h-8 w-8"
                 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                 disabled={currentPage === 1}
               >
                 <ChevronLeft size={14} />
               </Button>
               {Array.from({length: totalPages}, (_, i) => i + 1).map(pageNum => (
                  <Button 
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "ghost"} 
                    className={`h-8 w-8 ${pageNum !== currentPage ? 'text-slate-600 hover:bg-slate-100' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
               ))}
               <Button 
                 variant="outline" 
                 size="icon" 
                 className="h-8 w-8"
                 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                 disabled={currentPage === totalPages}
               >
                 <ChevronRight size={14} />
               </Button>
             </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-lg text-slate-800">{modalMode === 'tambah' ? 'Tambah Platform' : 'Edit Platform'}</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="h-8 w-8 text-slate-500 hover:text-red-500">
                  <X size={18} />
              </Button>
            </div>
            <form onSubmit={handleSave}>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Platform</label>
                  <Input 
                    placeholder="Contoh: Shopee, Tokopedia, dll" 
                    value={formData.nama_platform}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, nama_platform: e.target.value})}
                    required
                    autoFocus
                  />
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="is_active" 
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="h-4 w-4 text-bps-blue focus:ring-bps-blue border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-slate-700">
                    Aktif (Dapat dipilih saat registrasi)
                  </label>
                </div>
              </div>
              <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit">Simpan</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
             <div className="p-4 border-b">
                <h3 className="font-semibold text-lg text-red-600">Hapus Data</h3>
             </div>
             <div className="p-4 text-slate-600 space-y-2">
                <p>Apakah Anda yakin ingin menghapus platform ini?</p>
                <p className="font-semibold text-slate-800">"{confirmModal.nama}"</p>
                <p className="text-xs text-red-500 mt-2">Tindakan ini tidak dapat dibatalkan jika platform belum digunakan pada paket manapun.</p>
             </div>
             <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setConfirmModal({isOpen: false, id: null, nama: ''})}>Batal</Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white border-0" onClick={handleDelete}>Ya, Hapus</Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
