const _pegawaiCache = new Map<string, any>();

export async function getPegawaiByNip(nip: string) {
    if (!nip) return null;
    if (_pegawaiCache.has(nip)) return _pegawaiCache.get(nip);
    try {
        const apiKey = process.env.BPS_API_KEY || process.env.BPS_GATEWAY_API_KEY || 'BEPES!S005UMUTE';
        const params = new URLSearchParams({ kode_satker: '1200', page: '1', search: nip });
        const res = await fetch(`https://gateway-sumut.bps.web.id/api/pegawai?${params.toString()}`, {
            headers: { 'x-api-key': apiKey }
        });
        if (res.ok) {
            const json = await res.json();
            const pList = Array.isArray(json?.data?.data) ? json.data.data : (Array.isArray(json) ? json : []);
            const peg = pList.find((x: any) => x.nip_baru === nip || x.nip_lama === nip || x.nip === nip);
            if (peg) {
                const result = {
                    nip: peg.nip_baru || peg.nip_lama || peg.nip,
                    nama: peg.nama || peg.nama_lengkap || 'Pegawai',
                    nama_lengkap: peg.nama_lengkap || peg.nama || 'Pegawai',
                    nohp: peg.nohp || null,
                    foto_url: peg.foto || null
                };
                _pegawaiCache.set(nip, result);
                return result;
            }
        }
    } catch (err) {
        console.error('[BPS API] Fetch pegawai detail gagal untuk NIP:', nip, err);
    }
    return null;
}
