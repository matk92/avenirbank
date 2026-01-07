import { NextResponse } from 'next/server';

function apiBase() {
  return process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
}

export async function GET(request: Request) {
  const upstream = await fetch(`${apiBase()}/client/stocks`, {
    headers: {
      Authorization: request.headers.get('Authorization') ?? '',
    },
    cache: 'no-store',
  });
  const payload = await upstream.json().catch(() => null);
  return NextResponse.json(payload ?? { message: 'Erreur upstream' }, { status: upstream.status });
}



