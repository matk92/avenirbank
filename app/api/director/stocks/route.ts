import { NextResponse } from 'next/server';
import { FETCH_TAGS } from '@/lib/fetch';
import { revalidateTag } from 'next/cache';

function apiBase() {
  return process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
}

export async function GET(request: Request) {
  const upstream = await fetch(`${apiBase()}/director/stocks`, {
    headers: {
      Authorization: request.headers.get('Authorization') ?? '',
    },
    next: {
      revalidate: 60,
      tags: [FETCH_TAGS.stocks],
    },
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
  if (upstream.ok) {
    revalidateTag(FETCH_TAGS.stocks);
  }
  return NextResponse.json(payload ?? { message: 'Erreur upstream' }, { status: upstream.status });
}



