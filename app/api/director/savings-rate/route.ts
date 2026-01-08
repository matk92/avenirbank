import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { FETCH_TAGS } from '@/lib/fetch';
import { revalidateTag } from 'next/cache';

const BACKEND_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get('token')?.value;
  const authHeader = cookieToken ? `Bearer ${cookieToken}` : null;

  if (!authHeader) {
    return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/director/savings-rate`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      next: {
        // Stable-ish config: allow short caching.
        revalidate: 60,
        tags: [FETCH_TAGS.savingsRate],
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching savings rate:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la récupération du taux' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const requestAuthHeader = request.headers.get('authorization');
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get('token')?.value;
  const authHeader = requestAuthHeader || (cookieToken ? `Bearer ${cookieToken}` : null);

  if (!authHeader) {
    return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/director/savings-rate`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await response.json();
    if (response.ok) {
      revalidateTag(FETCH_TAGS.savingsRate);
    }
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error setting savings rate:', error);
    return NextResponse.json(
      { message: 'Erreur lors de la modification du taux' },
      { status: 500 }
    );
  }
}
