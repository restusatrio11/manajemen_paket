import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  ArrowLeft, Camera, UploadCloud, 
  PackageSearch, AlertCircle, X
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function FormPaketPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [ekspedisiList, setEkspedisiList] = useState<any[]>([]);
  const [platformList, setPlatformList] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    waktu_diterima: new Date().toISOString().slice(0, 16),
    nip_pegawai: '',
    ekspedisi_id: '',
    platform_id: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [pegawaiQuery, setPegawaiQuery] = useState('');
  const [pegawaiResults, setPegawaiResults] = useState<any[]>([]);
  const [showPegawaiDropdown, setShowPegawaiDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPegawaiDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (pegawaiQuery.trim().length > 2 && !formData.nip_pegawai) {
        api.get(`/master/pegawai?q=${pegawaiQuery}`)
           .then(res => {
              setPegawaiResults(res.data.data);
              setShowPegawaiDropdown(true);
           });
      } else if (!formData.nip_pegawai) {
        setPegawaiResults([]);
        setShowPegawaiDropdown(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [pegawaiQuery, formData.nip_pegawai]);

  useEffect(() => {
    // Fetch master data
    Promise.all([
      api.get('/master/ekspedisi'),
      api.get('/master/platform')
    ]).then(([resEks, resPlat]) => {
      setEkspedisiList(resEks.data.data.filter((d:any)=>d.is_active));
      setPlatformList(resPlat.data.data.filter((d:any)=>d.is_active));
    }).finally(() => {
      setInitLoading(false);
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
        return alert("Harap unggah foto bukti paket");
    }
    if (!formData.ekspedisi_id || !formData.platform_id || !formData.nip_pegawai) {
        return alert("Harap lengkapi ekspedisi, platform, dan NIP/Penerima");
    }

    setLoading(true);
    try {
      let fotoUrl = null;
      
      // Upload file first if exists
      if (selectedFile) {
        const fileData = new FormData();
        fileData.append('file', selectedFile);
        const uploadRes = await api.post('/upload', fileData, {
           headers: { 'Content-Type': 'multipart/form-data' }
        });
        fotoUrl = uploadRes.data.data.url;
      }

      // Format payload for backend
      const payload = {
        ekspedisi_id: Number(formData.ekspedisi_id),
        platform_id: parseInt(formData.platform_id),
        nip_pegawai: formData.nip_pegawai,
        foto_paket_url: fotoUrl,
        // waktu_diterima is sent if we want to override server default
      };

      await api.post('/paket', payload);
      navigate('/paket-masuk');
      
    } catch (error: any) {
      alert("Gagal meregistrasi paket: " + (error.response?.data?.message || 'Error API'));
    } finally {
      setLoading(false);
    }
  };

  if (initLoading) {
    return <LoadingSpinner text="Mempersiapkan Formulir Pendaftaran..." fullScreen />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="rounded-full h-10 w-10">
           <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Registrasi Paket Masuk</h1>
          <p className="text-sm text-slate-500">Unggah foto bukti paket atau resi penerimaan.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Kolom Kiri: Foto */}
        <div className="col-span-1 md:col-span-5 space-y-4">
          <Card className="overflow-hidden border-dashed border-2 bg-slate-50/50">
             <CardContent className="p-0">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                
                {previewUrl ? (
                   <div className="relative aspect-[3/4] w-full bg-black group">
                      <img src={previewUrl} alt="Preview" className={`w-full h-full object-contain`} />
                      
                      <div className="absolute bottom-4 left-0 w-full flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} className="shadow-lg">
                             Ganti Foto
                          </Button>
                      </div>
                   </div>
                ) : (
                   <div className="aspect-[3/4] w-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border">
                         <Camera size={28} className="text-slate-400" />
                      </div>
                      <p className="font-medium text-slate-700 mb-1">Unggah Bukti Paket</p>
                      <p className="text-xs mb-6">Unggah foto resi atau foto fisik paket secara langsung sebagai bukti.</p>
                      
                      <Button type="button" onClick={() => fileInputRef.current?.click()} className="gap-2 w-full">
                         <UploadCloud size={16} /> Pilih Foto
                      </Button>
                   </div>
                )}
             </CardContent>
          </Card>
          
          <div className="bg-blue-50 text-bps-blue p-3 rounded-md flex items-start gap-3 text-xs border border-blue-100">
             <AlertCircle size={16} className="shrink-0 mt-0.5" />
             <p>Pastikan kondisi paket atau detail resi terlihat cukup jelas pada saat difoto, untuk mempermudah validasi bukti paket masuk.</p>
          </div>
        </div>

        {/* Kolom Kanan: Form Data */}
        <div className="col-span-1 md:col-span-7 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
               <h3 className="font-semibold text-lg border-b pb-2">Detail Identifikasi Paket</h3>
               
               <div className="space-y-4">
                  <div className="space-y-1.5">
                     <label className="text-sm font-semibold text-slate-700">Waktu Diterima</label>
                     <Input 
                       type="datetime-local" 
                       value={formData.waktu_diterima}
                       onChange={e => setFormData({ ...formData, waktu_diterima: e.target.value })}
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Ekspedisi</label>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={formData.ekspedisi_id}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, ekspedisi_id: e.target.value })}
                        >
                           <option value="">Pilih kurir...</option>
                           {ekspedisiList.map(e => <option key={e.id} value={e.id}>{e.nama_ekspedisi}</option>)}
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Platform Asal</label>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          value={formData.platform_id}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, platform_id: e.target.value })}
                        >
                           <option value="">Pilih platform...</option>
                           {platformList.map(p => <option key={p.id} value={p.id}>{p.nama_platform}</option>)}
                        </select>
                     </div>
                  </div>

                  <div className="space-y-1.5 relative" ref={dropdownRef}>
                     <label className="text-sm font-semibold text-slate-700 flex justify-between">
                        <span>Penerima (NIP / Nama)</span>
                     </label>
                     <div className="flex gap-2">
                        <Input 
                          icon={PackageSearch} 
                          placeholder="Ketik min 3 huruf (NIP/Nama)..." 
                          className={`flex-1 ${formData.nip_pegawai ? 'ring-2 ring-green-500/20 border-green-500 bg-green-50/50' : ''}`}
                          value={pegawaiQuery}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                             setPegawaiQuery(e.target.value);
                             if (formData.nip_pegawai) setFormData({ ...formData, nip_pegawai: '' });
                          }}
                          onFocus={() => {
                            if (pegawaiResults.length > 0 && !formData.nip_pegawai) setShowPegawaiDropdown(true);
                          }}
                        />
                        {formData.nip_pegawai && (
                           <Button type="button" variant="ghost" size="icon" className="shrink-0 text-slate-400 hover:text-red-500" onClick={() => {
                              setFormData({ ...formData, nip_pegawai: '' });
                              setPegawaiQuery('');
                              setPegawaiResults([]);
                           }}>
                             <X size={18} />
                           </Button>
                        )}
                     </div>

                     {showPegawaiDropdown && (
                       <div className="absolute top-[68px] z-50 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {pegawaiResults.length === 0 ? (
                             <div className="p-3 text-sm text-slate-500 text-center">
                                {pegawaiQuery.length > 2 ? 'Pencarian tidak menemukan hasil...' : 'Ketik untuk mencari...'}
                             </div>
                          ) : (
                            pegawaiResults.map(p => (
                               <div 
                                  key={p.nip} 
                                  className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-0"
                                  onClick={() => {
                                     setFormData({ ...formData, nip_pegawai: p.nip });
                                     setPegawaiQuery(`${p.nip} - ${p.nama}`);
                                     setShowPegawaiDropdown(false);
                                  }}
                               >
                                  <div className="font-medium text-slate-800 text-sm">{p.nama}</div>
                                  <div className="text-xs text-slate-500 mt-0.5">{p.nip} • {p.jabatan}</div>
                               </div>
                            ))
                          )}
                       </div>
                     )}

                     {formData.nip_pegawai && (
                        <p className="text-xs text-green-600 font-medium mt-1.5 inline-flex items-center gap-1">
                           <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                           Terpilih: {formData.nip_pegawai}
                        </p>
                     )}
                  </div>
               </div>

               <div className="pt-6 border-t mt-6 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => navigate('/paket-masuk')}>Batal</Button>
                  <Button type="submit" disabled={loading} className="min-w-[150px]">
                     {loading ? 'Menyimpan...' : 'Registrasi Paket'}
                  </Button>
               </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
