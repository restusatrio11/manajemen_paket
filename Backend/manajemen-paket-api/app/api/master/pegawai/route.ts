import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    
    // Siapkan parameter untuk gateway BPS
    const params = new URLSearchParams({
      kode_satker: '1200',
      page: '1', // Selalu ambil halaman 1 untuk pencarian
    });

    // Lempar langsung keyword pencariannya ke parameter 'search' API gateway
    if (query) {
       params.append('search', query);
    }

    const url = `https://gateway-sumut.bps.web.id/api/pegawai?${params.toString()}`;
    const apiKey = process.env.BPS_GATEWAY_API_KEY || 'BEPES!S005UMUTE';

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      // Jangan di-cache karena hasil search sangat dinamis
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Gateway HTTP error: ${response.status}`);
    }

    const json = await response.json();
    
    let pegawaiList = [];
    // Data List aslinya ternyata ada di dalam json.data.data (Pagination object)
    if (json.status === 'success' && json.data && Array.isArray(json.data.data)) {
        pegawaiList = json.data.data;
    } else if (Array.isArray(json)) {
        pegawaiList = json;
    }
    
    // Normalisasi format response khusus untuk FormPaketPage UI
    const formattedPegawai = pegawaiList.map((p: any) => ({
      nip: p.nip_baru || p.nip_lama || p.nip || '0',
      nama: p.nama_lengkap || p.nama || 'Tanpa Nama',
      satker: p.satker || 'BPS Provinsi Sumatera Utara',
      jabatan: p.jabatan_nama || p.jfung || p.jabatan || 'Pegawai',
      foto: p.foto && p.foto !== "templates/images/nofoto.jpg" ? p.foto : null
    }));

    return NextResponse.json({
      success: true,
      data: formattedPegawai
    });
  } catch (error) {
    console.error('[GET /api/master/pegawai]', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil data pegawai dari gateway BPS Sumut' },
      { status: 500 }
    );
  }
}
