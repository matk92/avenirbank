import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.INTERNAL_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const conversationsResponse = await fetch(`${BACKEND_URL}/messages/conversations`, {
      headers: {
        Authorization: authHeader,
      },
    });

    if (!conversationsResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: conversationsResponse.status });
    }

    const conversations = await conversationsResponse.json();
    
    if (!Array.isArray(conversations) || conversations.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const conversationId = conversations[0].id;
    const messagesResponse = await fetch(`${BACKEND_URL}/messages/conversations/${conversationId}/messages`, {
      headers: {
        Authorization: authHeader,
      },
    });

    if (!messagesResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: messagesResponse.status });
    }

    const messages = await messagesResponse.json();
    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error('Error proxying request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}