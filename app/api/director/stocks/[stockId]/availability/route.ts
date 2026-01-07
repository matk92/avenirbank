import { NextResponse } from 'next/server';

function apiBase() {
  return process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
}

type Ctx = { params: { stockId: string } | Promise<{ stockId: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const { stockId } = await Promise.resolve(ctx.params);
  const body = await request.json().catch(() => null);
  const upstream = await fetch(`${apiBase()}/director/stocks/${stockId}/availability`, {
    method: 'PATCH',
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


