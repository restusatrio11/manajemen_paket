import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paket_masuk, users, master_ekspedisi, master_platform } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Helper for caching pegawai info inside the export processing
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const conditions = [];

    if (month && year) {
      conditions.push(sql`EXTRACT(MONTH FROM ${paket_masuk.waktu_diterima}) = ${month}`);
      conditions.push(sql`EXTRACT(YEAR FROM ${paket_masuk.waktu_diterima}) = ${year}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select({
        id: paket_masuk.id,
        waktu_diterima: paket_masuk.waktu_diterima,
        nip_pegawai: paket_masuk.nip_pegawai,
        status: paket_masuk.status,
        waktu_diambil: paket_masuk.waktu_diambil,
        nama_ekspedisi: master_ekspedisi.nama_ekspedisi,
        nama_platform: master_platform.nama_platform,
        nama_petugas: users.nama_lengkap,
      })
      .from(paket_masuk)
      .leftJoin(master_ekspedisi, eq(paket_masuk.ekspedisi_id, master_ekspedisi.id))
      .leftJoin(master_platform, eq(paket_masuk.platform_id, master_platform.id))
      .leftJoin(users, eq(paket_masuk.petugas_id, users.id))
      .where(whereClause)
      .orderBy(desc(paket_masuk.waktu_diterima));

    // Resolve pegawais
    const augmentedData = await Promise.all(data.map(async (pkg) => {
        const pegawai = await getPegawaiByNip(pkg.nip_pegawai);
        return { ...pkg, nama_penerima: pegawai?.nama || 'Tanpa Nama' };
    }));

    // Construct CSV Header
    let csvString = 'ID Paket,NIP Pegawai,Nama Penerima,Petugas Penerima,Waktu Diterima,Ekspedisi,Platform,Status,Waktu Diambil\n';

    // Populate CSV Rows
    augmentedData.forEach(row => {
        const formatTgl = (d: any) => d ? new Date(d).toLocaleString('id-ID') : '-';
        const cols = [
            `PKG-${String(row.id).padStart(5, '0')}`,
            row.nip_pegawai,
            `"${row.nama_penerima}"`,
            `"${row.nama_petugas || '-'}"`,
            `"${formatTgl(row.waktu_diterima)}"`,
            row.nama_ekspedisi || '-',
            row.nama_platform || '-',
            row.status,
            `"${formatTgl(row.waktu_diambil)}"`
        ];
        csvString += cols.join(',') + '\n';
    });

    return new NextResponse(csvString, {
        status: 200,
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="Laporan_Paket_${month || 'All'}_${year || 'All'}.csv"`
        }
    });

  } catch(e) {
      console.error('CSV Export Error:', e);
      return NextResponse.json({ success: false, message: 'Gagal mengekspor data' }, { status: 500 });
  }
}
