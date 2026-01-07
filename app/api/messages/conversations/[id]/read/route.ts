import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.INTERNAL_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const response = await fetch(`${BACKEND_URL}/messages/conversations/${id}/read`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
      },
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}