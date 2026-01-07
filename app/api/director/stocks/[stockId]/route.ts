import { NextResponse } from 'next/server';

function apiBase() {
  return process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
}

type Ctx = { params: { stockId: string } | Promise<{ stockId: string }> };

export async function DELETE(request: Request, ctx: Ctx) {
  const { stockId } = await Promise.resolve(ctx.params);
  const upstream = await fetch(`${apiBase()}/director/stocks/${stockId}`, {
    method: 'DELETE',
    headers: {
      Authorization: request.headers.get('Authorization') ?? '',
    },
    cache: 'no-store',
  });
  const payload = await upstream.json().catch(() => null);
  return NextResponse.json(payload ?? { ok: true }, { status: upstream.status });
}


