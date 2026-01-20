import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const upstreamUrl = `${API_BASE_URL}/notes/content/${id}`;

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
    console.error('BFF Error (notes/content):', error);
    return NextResponse.json({ error: 'BFF Internal Server Error' }, { status: 500 });
  }
}
