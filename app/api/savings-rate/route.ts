import { NextResponse } from 'next/server';
import { FETCH_TAGS } from '@/lib/fetch';

const BACKEND_URL =
  process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/savings-rate`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: {
        // Public + stable: allow Next Data Cache.
        revalidate: 60,
        tags: [FETCH_TAGS.savingsRate],
      },
    });

    if (!response.ok) {
      return NextResponse.json({ rate: 2.5 }, { status: 200 });
    }

    const data = await response.json().catch(() => null);
    const rate = typeof data?.rate === 'number' ? data.rate : Number(data?.rate);
    return NextResponse.json({ rate: Number.isFinite(rate) ? rate : 2.5 }, { status: 200 });
  } catch (error) {
    console.error('Error fetching savings rate:', error);
    return NextResponse.json({ rate: 2.5 }, { status: 200 });
  }
}