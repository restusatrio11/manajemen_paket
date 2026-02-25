import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { updateUserSchema } from '@/lib/validators';

type Params = { params: Promise<{ id: string }> };

// PUT /api/users/[id] — edit user (admin only)
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const requesterRole = request.headers.get('x-user-role');
    const requesterId = request.headers.get('x-user-id');
    const { id: paramId } = await params;
    const id = parseInt(paramId);

    if (isNaN(id)) return NextResponse.json({ success: false, message: 'ID tidak valid' }, { status: 400 });

    // Hanya admin atau user sendiri yang bisa edit
    if (requesterRole !== 'admin' && parseInt(requesterId!) !== id) {
      return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Input tidak valid', errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { password, ...restData } = parsed.data;
    const updateData: any = { ...restData };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Jika user biasa, tidak boleh ubah role
    if (requesterRole !== 'admin' && updateData.role) {
      delete updateData.role;
    }

    const [updated] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        username: users.username,
        nama_lengkap: users.nama_lengkap,
        role: users.role,
      });

    if (!updated) return NextResponse.json({ success: false, message: 'User tidak ditemukan' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'User berhasil diperbarui', data: updated });
  } catch (error) {
    console.error('[PUT /api/users/[id]]', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// DELETE /api/users/[id] — hapus user (admin only)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const role = request.headers.get('x-user-role');
    if (role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Hanya admin yang dapat menghapus user' }, { status: 403 });
    }

    const { id: paramId } = await params;
    const id = parseInt(paramId);
    if (isNaN(id)) return NextResponse.json({ success: false, message: 'ID tidak valid' }, { status: 400 });

    // Jangan izinkan hapus diri sendiri dari endpoint ini (optional rule)
    const requesterId = request.headers.get('x-user-id');
    if (parseInt(requesterId!) === id) {
      return NextResponse.json({ success: false, message: 'Tidak dapat menghapus akun sendiri' }, { status: 400 });
    }

    const [deleted] = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
    if (!deleted) return NextResponse.json({ success: false, message: 'User tidak ditemukan' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'User berhasil dihapus' });
  } catch (error: any) {
    console.error('[DELETE /api/users/[id]]', error);
    // Jika ada foreign key constraint
    if (error.code === '23503') {
        return NextResponse.json({ success: false, message: 'User tidak dapat dihapus karena sudah memiliki histori paket' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
