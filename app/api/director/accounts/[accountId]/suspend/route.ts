import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const response = await fetch(`${BACKEND_URL}/director/accounts/${accountId}/suspend`, {
      method: 'PATCH',
      headers: { Authorization: authHeader },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}