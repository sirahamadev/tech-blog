import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

export async function GET(_request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }

  const upstreamUrl = `${API_BASE_URL}/posts/${slug}`;

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
    console.error('BFF Error (posts/[slug]):', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
