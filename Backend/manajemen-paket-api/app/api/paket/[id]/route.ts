import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paket_masuk, users, master_ekspedisi, master_platform } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

type Params = { params: Promise<{ id: string }> };

const _pegawaiCache = new Map<string, any>();

async function getPegawaiByNip(nip: string) {
    if (!nip) return null;
    if (_pegawaiCache.has(nip)) return _pegawaiCache.get(nip);
    try {
        const apiKey = process.env.BPS_API_KEY || process.env.BPS_GATEWAY_API_KEY || 'BEPES!S005UMUTE';
        const params = new URLSearchParams({ kode_satker: '1200', page: '1', search: nip });
        const res = await fetch(`https://gateway-sumut.bps.web.id/api/pegawai?${params.toString()}`, {
            headers: { 'x-api-key': apiKey }
        });
        if (res.ok) {
            const json = await res.json();
            const pList = Array.isArray(json?.data?.data) ? json.data.data : (Array.isArray(json) ? json : []);
            const peg = pList.find((x: any) => x.nip_baru === nip || x.nip_lama === nip || x.nip === nip);
            if (peg) {
                const mapped = { nama: peg.nama_lengkap || peg.nama, foto_url: peg.foto || peg.foto_url || null };
                _pegawaiCache.set(nip, mapped);
                return mapped;
            }
        }
    } catch(e) { console.error('Gagal ambil data pegawai', e); }
    _pegawaiCache.set(nip, null);
    return null;
}

// GET /api/paket/[id] — detail paket
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    if (isNaN(id)) return NextResponse.json({ success: false, message: 'ID tidak valid' }, { status: 400 });

    const [data] = await db
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
      .where(eq(paket_masuk.id, id))
      .limit(1);

    if (!data) return NextResponse.json({ success: false, message: 'Paket tidak ditemukan' }, { status: 404 });

    const pegawai = await getPegawaiByNip(data.nip_pegawai);
    const augmentedData = { ...data, pegawai: pegawai || null };

    return NextResponse.json({ success: true, data: augmentedData });
  } catch (error) {
    console.error('[GET /api/paket/[id]]', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE /api/paket/[id] — hapus paket
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const role = request.headers.get('x-user-role');
    if (!role) {
      return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 });
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId);
    if (isNaN(id)) return NextResponse.json({ success: false, message: 'ID tidak valid' }, { status: 400 });

    const [deleted] = await db
      .delete(paket_masuk)
      .where(eq(paket_masuk.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Paket tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Paket berhasil dihapus' });
  } catch (error) {
    console.error('[DELETE /api/paket/[id]]', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT /api/paket/[id] — update paket
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const role = request.headers.get('x-user-role');
    if (!role) {
      return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 });
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId);
    if (isNaN(id)) return NextResponse.json({ success: false, message: 'ID tidak valid' }, { status: 400 });

    const body = await request.json();
    const { ekspedisi_id, platform_id, nip_pegawai } = body;

    const [updated] = await db
      .update(paket_masuk)
      .set({
        ekspedisi_id: ekspedisi_id ? Number(ekspedisi_id) : undefined,
        platform_id: platform_id ? Number(platform_id) : undefined,
        nip_pegawai: nip_pegawai || undefined,
      })
      .where(eq(paket_masuk.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Paket tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Paket berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('[PUT /api/paket/[id]]', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
