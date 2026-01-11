import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { FETCH_TAGS } from '@/lib/fetch';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const response = await fetch(`${BACKEND_URL}/director/accounts/${accountId}`, {
      method: 'DELETE',
      headers: { Authorization: authHeader },
      cache: 'no-store',
    });

    if (response.status === 204) {
			revalidateTag(FETCH_TAGS.directorAccounts);
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json();
		if (response.ok) {
			revalidateTag(FETCH_TAGS.directorAccounts);
		}
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}