import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { master_platform } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createPlatformSchema } from '@/lib/validators';

// GET /api/master/platform
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get('active') === 'true';

    const data = onlyActive
      ? await db.select().from(master_platform).where(eq(master_platform.is_active, true))
      : await db.select().from(master_platform);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[GET /api/master/platform]', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/master/platform
export async function POST(request: NextRequest) {
  try {
    const role = request.headers.get('x-user-role');
    if (role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Hanya admin yang dapat menambah platform' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createPlatformSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Input tidak valid', errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const [inserted] = await db.insert(master_platform).values(parsed.data).returning();
    return NextResponse.json({ success: true, message: 'Platform berhasil ditambahkan', data: inserted }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/master/platform]', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
