import { type NextRequest, NextResponse } from 'next/server';

const RAILWAY_URL = 'https://corpers-connect-server-production.up.railway.app';

async function handler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetUrl = `${RAILWAY_URL}/${path.join('/')}`;

  // Forward query string
  const { search } = new URL(request.url);
  const url = search ? `${targetUrl}${search}` : targetUrl;

  // Forward headers (drop host to avoid conflicts)
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!['host', 'connection'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  // Forward body for non-GET requests
  const hasBody = !['GET', 'HEAD'].includes(request.method);
  const body = hasBody ? await request.arrayBuffer() : undefined;

  try {
    const response = await fetch(url, {
      method: request.method,
      headers,
      body: body ? Buffer.from(body) : undefined,
    });

    const data = await response.arrayBuffer();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (err) {
    console.error('[proxy] error:', err);
    return NextResponse.json({ message: 'Proxy error' }, { status: 502 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
