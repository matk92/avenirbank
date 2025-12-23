import { NextResponse } from 'next/server';

type RegisterBody = { firstName: string; lastName: string; email: string; password: string };

export async function POST(request: Request) {
  const apiBase =
    process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ message: 'Corps de requête invalide' }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${apiBase}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ message: "Impossible de joindre l'API backend" }, { status: 502 });
  }

  const payload = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    return NextResponse.json(payload ?? { message: 'Registration failed' }, { status: upstream.status });
  }

  return NextResponse.json(payload ?? { ok: true }, { status: 201 });
}


