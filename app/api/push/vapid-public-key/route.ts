import { NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.INTERNAL_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/push/vapid-public-key`, { cache: 'no-store' });
    const data = await response.json().catch(() => null);
    return NextResponse.json(data ?? { publicKey: null }, { status: response.status });
  } catch (error) {
    console.error('Error proxying request:', error);
    return NextResponse.json({ publicKey: null }, { status: 500 });
  }
}