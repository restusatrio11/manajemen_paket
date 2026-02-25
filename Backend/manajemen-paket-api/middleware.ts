import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';

// Routes yang tidak perlu autentikasi
const PUBLIC_PATHS = ['/api/auth/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lewati route publik
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Hanya proteksi route /api/*
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('Authorization');
  const token = extractToken(authHeader);

  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Token tidak ditemukan. Silakan login.' },
      { status: 401 }
    );
  }

  try {
    const payload = await verifyToken(token);

    // Inject user info ke request headers untuk dipakai di route handlers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.sub);
    requestHeaders.set('x-user-username', payload.username);
    requestHeaders.set('x-user-name', payload.nama_lengkap);
    requestHeaders.set('x-user-role', payload.role);

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Token tidak valid atau sudah kadaluarsa.' },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: '/api/:path*',
};
