import { NextResponse } from 'next/server';

type LoginBody = { email: string; password: string };

export async function POST(request: Request) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ message: 'Corps de requête invalide' }, { status: 400 });
  }

  const upstream = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const payload = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    return NextResponse.json(payload ?? { message: 'Login failed' }, { status: upstream.status });
  }

  const token = payload?.access_token;
  if (!token) {
    return NextResponse.json({ message: 'Token manquant dans la réponse' }, { status: 502 });
  }

  const response = NextResponse.json(payload, { status: 200 });
  response.cookies.set('token', String(token), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}


