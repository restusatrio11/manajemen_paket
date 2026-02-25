import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// POST /api/upload — upload foto paket
export async function POST(request: NextRequest) {
  try {
    const role = request.headers.get('x-user-role');
    if (!role) {
      return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 });
    }

    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'File tidak ditemukan' }, { status: 400 });
    }

    // Validasi tipe file (hanya gambar)
    if (!file.type.startsWith('image/')) {
        return NextResponse.json({ success: false, message: 'Hanya menerima file gambar' }, { status: 400 });
    }

    // Validasi ukuran (contoh: maks 5MB)
    if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ success: false, message: 'Ukuran file maksimal 5MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Buat nama file unik
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const extension = file.name.split('.').pop();
    const filename = `paket-${uniqueSuffix}.${extension}`;

    // Pastikan direktori upload ada
    const uploadDir = join(process.cwd(), process.env.UPLOAD_DIR || 'public/uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e: any) {
      if (e.code !== 'EEXIST') throw e;
    }

    // Simpan file ke sistem (local storage)
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Dapatkan URL relatif (misal: /uploads/paket-123.jpg)
    const relativeUrl = `/${(process.env.UPLOAD_DIR || 'public/uploads').replace(/^public\//, '')}/${filename}`;

    return NextResponse.json({ 
        success: true, 
        message: 'File berhasil diunggah', 
        data: {
            url: relativeUrl,
            filename
        } 
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/upload]', error);
    return NextResponse.json({ success: false, message: 'Terjadi kesalahan server saat mengunggah file' }, { status: 500 });
  }
}
