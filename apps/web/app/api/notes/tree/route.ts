import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const upstreamUrl = `${API_BASE_URL}/notes/tree?${searchParams.toString()}`;

  try {
    const res = await fetch(upstreamUrl, { cache: 'no-store' });
    const contentType = res.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await res.json() : await res.text();

    if (!res.ok) {
      return NextResponse.json(
        { error: typeof body === 'string' ? body : body?.error || 'Upstream error' },
        { status: res.status },
      );
    }

    return NextResponse.json(body, { status: res.status });
  } catch (error) {
    console.error('BFF Error (notes/tree):', error);
    return NextResponse.json({ error: 'BFF Internal Server Error' }, { status: 500 });
  }
}
