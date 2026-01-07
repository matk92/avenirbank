import { NextResponse } from 'next/server';

function apiBase() {
  return process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
}

export async function GET(request: Request) {
  const upstream = await fetch(`${apiBase()}/director/stocks`, {
    headers: {
      Authorization: request.headers.get('Authorization') ?? '',
    },
    cache: 'no-store',
  });
  const payload = await upstream.json().catch(() => null);
  return NextResponse.json(payload ?? { message: 'Erreur upstream' }, { status: upstream.status });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const upstream = await fetch(`${apiBase()}/director/stocks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.get('Authorization') ?? '',
    },
    body: JSON.stringify(body ?? {}),
    cache: 'no-store',
  });
  const payload = await upstream.json().catch(() => null);
  return NextResponse.json(payload ?? { message: 'Erreur upstream' }, { status: upstream.status });
}



