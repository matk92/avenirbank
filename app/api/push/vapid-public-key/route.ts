import { NextResponse } from 'next/server';
import { FETCH_TAGS } from '@/lib/fetch';

const BACKEND_URL =
  process.env.INTERNAL_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/push/vapid-public-key`, {
      next: {
        // Public + stable: the public key rarely changes.
        revalidate: 60 * 60,
        tags: [FETCH_TAGS.config],
      },
    });

    const data = await response.json().catch(() => null);
    const publicKey = typeof data?.publicKey === 'string' ? data.publicKey : null;
    return NextResponse.json({ publicKey }, { status: response.status });
  } catch (error) {
    console.error('Error proxying request:', error);
    return NextResponse.json({ publicKey: null }, { status: 500 });
  }
}