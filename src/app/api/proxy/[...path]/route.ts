import { type NextRequest, NextResponse } from 'next/server';

const RAILWAY_URL = 'https://corpers-connect-server-production.up.railway.app';

// Headers that must not be forwarded from the upstream response to the browser.
// content-encoding is dropped because fetch() already decompresses the body,
// so re-sending it causes the browser to try to decompress again (broken).
// transfer-encoding is hop-by-hop and must not be forwarded.
const DROP_RESPONSE_HEADERS = new Set([
  'content-encoding',
  'transfer-encoding',
  'connection',
  'keep-alive',
]);

async function handler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetUrl = `${RAILWAY_URL}/${path.join('/')}`;

  // Forward query string
  const { search } = new URL(request.url);
  const url = search ? `${targetUrl}${search}` : targetUrl;

  // Forward request headers (drop hop-by-hop headers)
  const reqHeaders = new Headers();
  request.headers.forEach((value, key) => {
    if (!['host', 'connection', 'keep-alive'].includes(key.toLowerCase())) {
      reqHeaders.set(key, value);
    }
  });

  // Forward body for non-GET requests
  const hasBody = !['GET', 'HEAD'].includes(request.method);
  const body = hasBody ? await request.arrayBuffer() : undefined;

  try {
    const upstream = await fetch(url, {
      method: request.method,
      headers: reqHeaders,
      body: body ? Buffer.from(body) : undefined,
    });

    const data = await upstream.arrayBuffer();

    // Forward ALL upstream response headers to the browser, including
    // Set-Cookie.  Without this, auth cookies set by the backend are silently
    // discarded and the user can never be authenticated.
    const resHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      if (!DROP_RESPONSE_HEADERS.has(key.toLowerCase())) {
        resHeaders.append(key, value);
      }
    });

    return new NextResponse(data, {
      status: upstream.status,
      headers: resHeaders,
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
