import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/director/savings-rate`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ rate: 2.5 }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json({ rate: data.rate || 2.5 }, { status: 200 });
  } catch (error) {
    console.error('Error fetching savings rate:', error);
    return NextResponse.json({ rate: 2.5 }, { status: 200 });
  }
}
