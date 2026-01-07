import { NextRequest, NextResponse } from 'next/server';

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
    });

    const data = await response.json();
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
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}