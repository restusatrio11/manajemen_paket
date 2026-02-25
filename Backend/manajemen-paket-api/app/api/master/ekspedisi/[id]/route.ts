import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { master_ekspedisi } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createEkspedisiSchema } from '@/lib/validators';

type Params = { params: Promise<{ id: string }> };

// PUT /api/master/ekspedisi/[id] — update ekspedisi
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const role = request.headers.get('x-user-role');
    if (role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Hanya admin yang dapat mengedit ekspedisi' }, { status: 403 });
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId);
    if (isNaN(id)) return NextResponse.json({ success: false, message: 'ID tidak valid' }, { status: 400 });

    const body = await request.json();
    const parsed = createEkspedisiSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Input tidak valid', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(master_ekspedisi)
      .set(parsed.data)
      .where(eq(master_ekspedisi.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Ekspedisi tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Ekspedisi berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('[PUT /api/master/ekspedisi/[id]]', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE /api/master/ekspedisi/[id] — hapus ekspedisi
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const role = request.headers.get('x-user-role');
    if (role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Hanya admin yang dapat menghapus ekspedisi' }, { status: 403 });
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId);
    if (isNaN(id)) return NextResponse.json({ success: false, message: 'ID tidak valid' }, { status: 400 });

    const [deleted] = await db
      .delete(master_ekspedisi)
      .where(eq(master_ekspedisi.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Ekspedisi tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Ekspedisi berhasil dihapus' });
  } catch (error) {
    console.error('[DELETE /api/master/ekspedisi/[id]]', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
