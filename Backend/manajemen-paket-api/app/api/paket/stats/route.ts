import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { master_ekspedisi, paket_masuk } from '@/lib/db/schema';
import { eq, sql, desc, and } from 'drizzle-orm';
import { getPegawaiByNip } from '@/lib/api-ext';

// GET /api/paket/stats — statistik dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const dateFilters = [];
    if (month && year) {
      dateFilters.push(sql`EXTRACT(MONTH FROM ${paket_masuk.waktu_diterima}) = ${Number(month)}`);
      dateFilters.push(sql`EXTRACT(YEAR FROM ${paket_masuk.waktu_diterima}) = ${Number(year)}`);
    }

    const baseWhere = dateFilters.length > 0 ? and(...dateFilters) : undefined;

    const [total] = await db.select({ count: sql<number>`COUNT(*)` })
      .from(paket_masuk)
      .where(baseWhere);
      
    const [menunggu] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(paket_masuk)
      .where(and(eq(paket_masuk.status, 'menunggu_diambil'), baseWhere));
      
    const [sudahDiambil] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(paket_masuk)
      .where(and(eq(paket_masuk.status, 'sudah_diambil'), baseWhere));

    // Paket masuk hari ini (tetap hari ini secara absolut, atau bisa disesuaikan, tapi biasanya stats "hari ini" adalah daily absolute)
    const [hariIni] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(paket_masuk)
      .where(sql`DATE(waktu_diterima) = CURRENT_DATE`);

    // Top ekspedisi
    const topEkspedisiRaw = await db
      .select({
        id: master_ekspedisi.id,
        nama: master_ekspedisi.nama_ekspedisi,
        count: sql<number>`COUNT(*)::int`
      })
      .from(paket_masuk)
      .leftJoin(master_ekspedisi, eq(paket_masuk.ekspedisi_id, master_ekspedisi.id))
      .where(baseWhere)
      .groupBy(master_ekspedisi.id, master_ekspedisi.nama_ekspedisi)
      .orderBy(desc(sql`COUNT(*)`));

    const top4 = topEkspedisiRaw.slice(0, 3);
    const lainnyaCount = topEkspedisiRaw.slice(3).reduce((acc, curr) => acc + curr.count, 0);
    const top_ekspedisi = [...top4];
    if (lainnyaCount > 0) {
      top_ekspedisi.push({ id: 0, nama: 'Lainnya', count: lainnyaCount });
    }

    let trenWhere = sql`waktu_diterima >= CURRENT_DATE - INTERVAL '7 days'`;
    if (baseWhere) {
      trenWhere = baseWhere; 
    }

    // Agregasi Harian: Masuk
    const trenMasuk = await db
      .select({
        tanggal: sql<string>`TO_CHAR(waktu_diterima, 'YYYY-MM-DD')`,
        count: sql<number>`COUNT(*)::int`
      })
      .from(paket_masuk)
      .where(trenWhere)
      .groupBy(sql`TO_CHAR(waktu_diterima, 'YYYY-MM-DD')`);

    // Agregasi Harian: Diambil
    let trenDiambilWhere = sql`waktu_diambil >= CURRENT_DATE - INTERVAL '7 days' AND waktu_diambil IS NOT NULL`;
    if (month && year) {
        trenDiambilWhere = sql`EXTRACT(MONTH FROM waktu_diambil) = ${Number(month)} AND EXTRACT(YEAR FROM waktu_diambil) = ${Number(year)} AND waktu_diambil IS NOT NULL`;
    }

    const trenDiambil = await db
      .select({
        tanggal: sql<string>`TO_CHAR(waktu_diambil, 'YYYY-MM-DD')`,
        count: sql<number>`COUNT(*)::int`
      })
      .from(paket_masuk)
      .where(trenDiambilWhere)
      .groupBy(sql`TO_CHAR(waktu_diambil, 'YYYY-MM-DD')`);

    // Merge both arrays by Date
    const harianMap = new Map<string, any>();
    
    trenMasuk.forEach(row => {
      harianMap.set(row.tanggal, { tanggal: row.tanggal, count_masuk: row.count, count_diambil: 0 });
    });
    
    trenDiambil.forEach(row => {
      if (harianMap.has(row.tanggal)) {
        harianMap.get(row.tanggal).count_diambil = row.count;
      } else {
        harianMap.set(row.tanggal, { tanggal: row.tanggal, count_masuk: 0, count_diambil: row.count });
      }
    });

    const trenHarian = Array.from(harianMap.values()).sort((a, b) => a.tanggal.localeCompare(b.tanggal));


    // Top 5 Pegawai Terbanyak
    const topPegawaiRaw = await db
      .select({
        nip: paket_masuk.nip_pegawai,
        count: sql<number>`COUNT(*)::int`
      })
      .from(paket_masuk)
      .where(baseWhere)
      .groupBy(paket_masuk.nip_pegawai)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(5);

    const topPegawai = await Promise.all(
      topPegawaiRaw.map(async (row) => {
        const peg = await getPegawaiByNip(row.nip);
        return {
          nip: row.nip,
          nama: peg ? (peg.nama_lengkap || peg.nama) : 'Pegawai Tidak Diketahui',
          foto: peg?.foto_url || null,
          count: row.count
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        total: Number(total.count),
        menunggu_diambil: Number(menunggu.count),
        sudah_diambil: Number(sudahDiambil.count),
        masuk_hari_ini: Number(hariIni.count),
        top_ekspedisi,
        tren_harian: trenHarian,
        top_pegawai: topPegawai
      },
    });
  } catch (error) {
    console.error('[GET /api/paket/stats]', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
