import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { FETCH_TAGS } from '@/lib/fetch';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { clientId } = await params;
  
  try {
    const body = await request.json();
    const response = await fetch(`${BACKEND_URL}/director/clients/${clientId}`, {
      method: 'PATCH',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await response.json();
		if (response.ok) {
			revalidateTag(FETCH_TAGS.directorClients);
		}
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { clientId } = await params;
  
  try {
    const response = await fetch(`${BACKEND_URL}/director/clients/${clientId}`, {
      method: 'DELETE',
      headers: { Authorization: authHeader },
      cache: 'no-store',
    });

    if (response.status === 204) {
			revalidateTag(FETCH_TAGS.directorClients);
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json();
		if (response.ok) {
			revalidateTag(FETCH_TAGS.directorClients);
		}
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}