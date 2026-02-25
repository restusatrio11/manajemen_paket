import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { master_ekspedisi } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createEkspedisiSchema } from '@/lib/validators';

// GET /api/master/ekspedisi — list semua ekspedisi
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get('active') === 'true';

    const query = db.select().from(master_ekspedisi);
    const data = onlyActive
      ? await db.select().from(master_ekspedisi).where(eq(master_ekspedisi.is_active, true))
      : await query;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[GET /api/master/ekspedisi]', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST /api/master/ekspedisi — tambah ekspedisi (admin only)
export async function POST(request: NextRequest) {
  try {
    const role = request.headers.get('x-user-role');
    if (role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Hanya admin yang dapat menambah ekspedisi' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createEkspedisiSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Input tidak valid', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [inserted] = await db.insert(master_ekspedisi).values(parsed.data).returning();
    return NextResponse.json({ success: true, message: 'Ekspedisi berhasil ditambahkan', data: inserted }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/master/ekspedisi]', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
