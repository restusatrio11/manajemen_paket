import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import bcrypt from 'bcryptjs';
import { createUserSchema } from '@/lib/validators';

// GET /api/users — list semua user (admin only)
export async function GET(request: NextRequest) {
  try {
    const role = request.headers.get('x-user-role');
    if (role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Hanya admin yang dapat melihat daftar user' }, { status: 403 });
    }

    const data = await db
      .select({
        id: users.id,
        username: users.username,
        nama_lengkap: users.nama_lengkap,
        role: users.role,
        created_at: users.created_at,
      })
      .from(users);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[GET /api/users]', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/users — tambah user baru (admin only)
export async function POST(request: NextRequest) {
  try {
    const requesterRole = request.headers.get('x-user-role');
    if (requesterRole !== 'admin') {
      return NextResponse.json({ success: false, message: 'Hanya admin yang dapat menambah user' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Input tidak valid', errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { username, password, nama_lengkap, role } = parsed.data;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const [inserted] = await db.insert(users).values({
      username,
      password: hashedPassword,
      nama_lengkap,
      role,
    }).returning({
      id: users.id,
      username: users.username,
      nama_lengkap: users.nama_lengkap,
      role: users.role,
    });

    return NextResponse.json({ success: true, message: 'User berhasil ditambahkan', data: inserted }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/users]', error);
    if (error.code === '23505') { // Unique violation in Postgres
      return NextResponse.json({ success: false, message: 'Username sudah digunakan' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
