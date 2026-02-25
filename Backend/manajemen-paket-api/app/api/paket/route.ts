import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paket_masuk, users, master_ekspedisi, master_platform } from '@/lib/db/schema';
import { eq, desc, and, or, ilike, sql } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { createPaketSchema } from '@/lib/validators';
import { getPegawaiByNip } from '@/lib/api-ext';

// GET /api/paket — list paket dengan filter opsional

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const nip_pegawai = searchParams.get('nip_pegawai');
    const ekspedisi_id = searchParams.get('ekspedisi_id');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [];
    if (status) {
      conditions.push(eq(paket_masuk.status, status));
    }
    if (nip_pegawai) {
      conditions.push(eq(paket_masuk.nip_pegawai, nip_pegawai));
    }
    if (ekspedisi_id) {
      conditions.push(eq(paket_masuk.ekspedisi_id, parseInt(ekspedisi_id)));
    }
    if (search) {
       // Search logic: NIP or ID (if looks like PKG-XXX or just number)
       const searchStr = `%${search}%`;
       const orConditions = [
          ilike(paket_masuk.nip_pegawai, searchStr)
       ];
       
       // Cek apakah user input format PKG-000001
       let pkgId = null;
       if (search.toUpperCase().startsWith('PKG-')) {
          pkgId = parseInt(search.substring(4), 10);
       } else if (!isNaN(Number(search))) {
          pkgId = parseInt(search, 10);
       }

       if (pkgId && !isNaN(pkgId)) {
          orConditions.push(eq(paket_masuk.id, pkgId));
       }

       // Jika search bukan ID melulu (kemungkinan nama), cari NIP dari BPS API
       if (isNaN(Number(search)) && !search.toUpperCase().startsWith('PKG-')) {
          try {
             // Opsional: Lakukan request ke gateway BPS Sumut untuk mencari NIP by Nama
             // Ini memungkinkan pencarian nama di frontend meski backend tidak simpan nama
             const params = new URLSearchParams({ kode_satker: '1200', page: '1', search: search });
             const url = `https://gateway-sumut.bps.web.id/api/pegawai?${params.toString()}`;
             const apiKey = process.env.BPS_API_KEY || process.env.BPS_GATEWAY_API_KEY || 'BEPES!S005UMUTE';
             const response = await fetch(url, { headers: { 'x-api-key': apiKey } });
             if (response.ok) {
                const json = await response.json();
                let pegawaiList: any[] = [];
                if (json.status === 'success' && json.data && Array.isArray(json.data.data)) {
                    pegawaiList = json.data.data;
                } else if (Array.isArray(json)) {
                    pegawaiList = json;
                }
                const nips = pegawaiList.map(p => p.nip_baru || p.nip_lama || p.nip).filter(Boolean);
                if (nips.length > 0) {
                    // Karena Drizzle 'inArray' belum diimpor, kita pakai deret OR saja
                    for (const nip of nips) {
                        orConditions.push(eq(paket_masuk.nip_pegawai, nip));
                    }
                }
             }
          } catch (e) {
             console.error("Gagal reverse lookup NIP dari BPS API", e);
          }
       }

       conditions.push(or(...orConditions));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Query dengan join ke tabel relasi
    const data = await db
      .select({
        id: paket_masuk.id,
        waktu_diterima: paket_masuk.waktu_diterima,
        foto_paket_url: paket_masuk.foto_paket_url,
        nip_pegawai: paket_masuk.nip_pegawai,
        status: paket_masuk.status,
        waktu_diambil: paket_masuk.waktu_diambil,
        diambil_oleh: paket_masuk.diambil_oleh,
        ekspedisi_id: paket_masuk.ekspedisi_id,
        platform_id: paket_masuk.platform_id,
        nama_ekspedisi: master_ekspedisi.nama_ekspedisi,
        nama_platform: master_platform.nama_platform,
        petugas_id: paket_masuk.petugas_id,
        nama_petugas: users.nama_lengkap,
      })
      .from(paket_masuk)
      .leftJoin(master_ekspedisi, eq(paket_masuk.ekspedisi_id, master_ekspedisi.id))
      .leftJoin(master_platform, eq(paket_masuk.platform_id, master_platform.id))
      .leftJoin(users, eq(paket_masuk.petugas_id, users.id))
      .where(whereClause)
      .orderBy(desc(paket_masuk.waktu_diterima))
      .limit(limit)
      .offset(offset);

    // Augment data dengan identitas pegawai
    const augmentedData = await Promise.all(data.map(async (pkg) => {
        const pegawai = await getPegawaiByNip(pkg.nip_pegawai);
        return { ...pkg, pegawai: pegawai || null };
    }));

    // Hitung total
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(paket_masuk)
      .where(whereClause);

    return NextResponse.json({
      success: true,
      data: augmentedData,
      pagination: {
        page,
        limit,
        total: Number(count),
        total_pages: Math.ceil(Number(count) / limit),
      },
    });
  } catch (error) {
    console.error('[GET /api/paket]', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/paket — catat paket masuk baru
export async function POST(request: NextRequest) {
  try {
    const petugasId = request.headers.get('x-user-id');
    if (!petugasId) {
      return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createPaketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Input tidak valid', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { foto_paket_url, ekspedisi_id, platform_id, nip_pegawai } = parsed.data;

    const [inserted] = await db.insert(paket_masuk).values({
      foto_paket_url,
      ekspedisi_id: ekspedisi_id ?? null,
      platform_id: platform_id ?? null,
      nip_pegawai,
      petugas_id: parseInt(petugasId),
      status: 'menunggu_diambil',
    }).returning();

    // Trigger WA Notification (Non-blocking)
    const sendWA = async () => {
       try {
          console.log('[WA Notify] Memulai proses notifikasi untuk NIP:', nip_pegawai);
          const apiKey = process.env.BPS_GATEWAY_API_KEY || 'BEPES!S005UMUTE';
          
          const params = new URLSearchParams({ kode_satker: '1200', page: '1', search: nip_pegawai });
          const urlPegawai = `https://gateway-sumut.bps.web.id/api/pegawai?${params.toString()}`;
          const resPegawai = await fetch(urlPegawai, { headers: { 'x-api-key': apiKey } });
          if (!resPegawai.ok) {
             console.error('[WA Notify] Gagal mengambil data pegawai. HTTP:', resPegawai.status);
             return;
          }
          
          const json = await resPegawai.json();
          let pegawaiList: any[] = [];
          if (json.status === 'success' && json.data && Array.isArray(json.data.data)) {
              pegawaiList = json.data.data;
          } else if (Array.isArray(json)) {
              pegawaiList = json;
          }
          
          const pegawai = pegawaiList.find(p => p.nip_baru === nip_pegawai || p.nip_lama === nip_pegawai || p.nip === nip_pegawai);
          
          if (!pegawai) {
             console.log('[WA Notify] Pegawai tidak ditemukan untuk NIP:', nip_pegawai);
             return;
          }
          
          if (!pegawai.nohp) {
             console.log('[WA Notify] Pegawai ditemukan tetapi tidak memiliki nomor HP', pegawai.nama);
             return;
          }

          console.log(`[WA Notify] Ditemukan No. HP: ${pegawai.nohp} untuk pegawai: ${pegawai.nama_lengkap || pegawai.nama}`);

          const filename = foto_paket_url.split('/').pop() || ''; 
          let uploadDir = process.env.UPLOAD_DIR || 'public/uploads';
          if (uploadDir.startsWith('./')) uploadDir = uploadDir.slice(2);
          
          const filePath = join(process.cwd(), uploadDir, filename);
          console.log('[WA Notify] Membaca file gambar dari:', filePath);
          
          const fileBuffer = await readFile(filePath);
          
          const formData = new FormData();
          formData.append('nomor', pegawai.nohp);
          
          // Next.js (Node 18+) fetch supports File/Blob in FormData if properly constructed.
          // Using File object is safer than Blob in some native fetch implementations.
          let fileObj;
          if (typeof File !== 'undefined') {
              fileObj = new File([fileBuffer], 'foto_paket.jpg', { type: 'image/jpeg' });
          } else {
              fileObj = new Blob([fileBuffer], { type: 'image/jpeg' }) as any;
          }

          formData.append('file', fileObj, 'foto_paket.jpg');
          formData.append('caption', `Halo *${pegawai.nama_lengkap || pegawai.nama || 'Pegawai BPS'}*,\n\nAda paket masuk untuk Anda dengan ID *PKG-${String(inserted.id).padStart(6, '0')}*.\nStatus saat ini: *Menunggu Diambil* di Pos Satpam.\n\nSilakan ambil paket Anda. Terima kasih.`);

          console.log('[WA Notify] Mengirim request ke gateway...');
          const waUrl = 'https://gateway-sumut.bps.web.id/api/wa/send-media';
          const waRes = await fetch(waUrl, {
             method: 'POST',
             headers: {
                'x-api-key': apiKey
                // Do not set Content-Type here, let fetch generate the boundary for form-data
             },
             body: formData
          });
          
          if (!waRes.ok) {
             console.error('[WA Notify] Gagal mengirim WhatsApp:', await waRes.text());
          } else {
             console.log('[WA Notify] ✅ Berhasil dikirim ke', pegawai.nohp);
          }
       } catch (err) {
          console.error('[WA Notify] Exception tertangkap:', err);
       }
    };

    // Eksekusi asinkron, tangkap error jika ada
    sendWA().catch(e => console.error('[WA Notify] Unhandled Promise Rejection:', e));

    return NextResponse.json(
      { success: true, message: 'Paket berhasil dicatat', data: inserted },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/paket]', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
