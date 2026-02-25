import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const username = request.headers.get('x-user-username');
  const namaLengkap = request.headers.get('x-user-name');
  const role = request.headers.get('x-user-role');

  return NextResponse.json({
    success: true,
    data: {
      id: userId ? parseInt(userId) : null,
      username,
      nama_lengkap: namaLengkap,
      role,
    },
  });
}
