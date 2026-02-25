import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paket_masuk } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { ambilPaketSchema } from '@/lib/validators';
import { getPegawaiByNip } from '@/lib/api-ext';

type Params = { params: Promise<{ id: string }> };

// PUT /api/paket/[id]/ambil — update status paket menjadi sudah diambil
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    if (isNaN(id)) return NextResponse.json({ success: false, message: 'ID tidak valid' }, { status: 400 });

    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      // Empty body is acceptable
    }
    const parsed = ambilPaketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Input tidak valid', errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    // Cek status saat ini
    const [paket] = await db.select({ status: paket_masuk.status, nip_pegawai: paket_masuk.nip_pegawai }).from(paket_masuk).where(eq(paket_masuk.id, id)).limit(1);
    if (!paket) return NextResponse.json({ success: false, message: 'Paket tidak ditemukan' }, { status: 404 });
    if (paket.status === 'sudah_diambil') return NextResponse.json({ success: false, message: 'Paket sudah diambil sebelumnya' }, { status: 400 });

    const [updated] = await db.update(paket_masuk)
      .set({
        status: 'sudah_diambil',
        waktu_diambil: sql`CURRENT_TIMESTAMP`,
        diambil_oleh: parsed.data.diambil_oleh,
      })
      .where(eq(paket_masuk.id, id))
      .returning();

    // Fire & Forget: Kirim Notifikasi WA Terima Kasih
    const sendWATerimaKasih = async () => {
      try {
        const apiKey = process.env.BPS_API_KEY || process.env.BPS_GATEWAY_API_KEY || 'BEPES!S005UMUTE';
        const gatewayUrl = process.env.WA_GATEWAY_URL || 'https://gateway-sumut.bps.web.id/api/wa';
        if (!apiKey) {
          console.warn('[WA Notify] API Key tidak dikonfigurasi. Lewati WA.');
          return;
        }

        const pegawai = await getPegawaiByNip(paket.nip_pegawai);
        if (!pegawai || !pegawai.nohp) {
          console.warn('[WA Notify] Pegawai atau No HP tidak ditemukan untuk NIP:', paket.nip_pegawai);
          return;
        }

        // Siapkan pesan teks
        const nama = pegawai.nama_lengkap || pegawai.nama || 'Pegawai BPS';
        const pesan = `Halo *${nama}*,\n\nTerima kasih, paket Anda dengan ID *PKG-${String(id).padStart(6, '0')}* sudah diambil di resepsionis/satpam.\n\nSemoga harimu menyenangkan!`;

        const waRes = await fetch(`${gatewayUrl}/send-text`, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nomor: pegawai.nohp,
            pesan: pesan
          })
        });

        if (!waRes.ok) {
           console.error('[WA Notify] Gagal mengirim WhatsApp Terima Kasih:', await waRes.text());
        } else {
           console.log('[WA Notify] ✅ Berhasil dikirim teks ke', pegawai.nohp);
        }
      } catch (err) {
        console.error('[WA Notify] Exception tertangkap:', err);
      }
    };

    sendWATerimaKasih().catch(e => console.error('[WA Notify] Unhandled Promise Rejection:', e));

    return NextResponse.json({ success: true, message: 'Status paket berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('[PUT /api/paket/[id]/ambil]', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
