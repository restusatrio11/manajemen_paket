import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { master_platform } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createPlatformSchema } from '@/lib/validators';

type Params = { params: Promise<{ id: string }> };

// PUT /api/master/platform/[id] — update platform
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const role = request.headers.get('x-user-role');
    if (role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Hanya admin yang dapat mengedit platform' }, { status: 403 });
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId);
    if (isNaN(id)) return NextResponse.json({ success: false, message: 'ID tidak valid' }, { status: 400 });

    const body = await request.json();
    const parsed = createPlatformSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Input tidak valid', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(master_platform)
      .set(parsed.data)
      .where(eq(master_platform.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Platform tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Platform berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('[PUT /api/master/platform/[id]]', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE /api/master/platform/[id] — hapus platform
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const role = request.headers.get('x-user-role');
    if (role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Hanya admin yang dapat menghapus platform' }, { status: 403 });
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId);
    if (isNaN(id)) return NextResponse.json({ success: false, message: 'ID tidak valid' }, { status: 400 });

    const [deleted] = await db
      .delete(master_platform)
      .where(eq(master_platform.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Platform tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Platform berhasil dihapus' });
  } catch (error) {
    console.error('[DELETE /api/master/platform/[id]]', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
