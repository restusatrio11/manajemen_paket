import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { paket_masuk } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { ambilPaketSchema } from '@/lib/validators';

type Params = { params: Promise<{ id: string }> };

// PUT /api/paket/[id]/ambil — update status paket menjadi sudah diambil
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    if (isNaN(id)) return NextResponse.json({ success: false, message: 'ID tidak valid' }, { status: 400 });

    const body = await request.json();
    const parsed = ambilPaketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Input tidak valid', errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    // Cek status saat ini
    const [paket] = await db.select({ status: paket_masuk.status }).from(paket_masuk).where(eq(paket_masuk.id, id)).limit(1);
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

    return NextResponse.json({ success: true, message: 'Status paket berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('[PUT /api/paket/[id]/ambil]', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
