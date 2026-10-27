const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

function backendUrl() {
  return (process.env.BACKEND_URL || '').replace(/\/+$/, '');
}

function requestPath(value) {
  const parts = Array.isArray(value) ? value : [value];
  return parts
    .filter(Boolean)
    .flatMap((part) => String(part).split('/'))
    .map(encodeURIComponent)
    .join('/');
}

/**
 * Same-origin proxy for the Spring Boot API.
 *
 * Vercel serves the React application, while BACKEND_URL points at the
 * long-running Java service. Keeping /api on the Vercel origin means the
 * backend's session cookie stays first-party in the browser.
 */
export default async function handler(req, res) {
  const baseUrl = backendUrl();
  if (!baseUrl) {
    return res.status(503).json({
      message: 'Server configuration error: BACKEND_URL is not configured in Vercel.',
    });
  }

  const path = requestPath(req.query.path);
  const url = new URL(`${baseUrl}/api/${path}`);
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== 'path' && value !== undefined) {
      url.searchParams.append(key, Array.isArray(value) ? value.join(',') : value);
    }
  }

  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined && !HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers[key] = Array.isArray(value) ? value.join(', ') : value;
    }
  }
  headers['x-forwarded-host'] = req.headers.host || '';
  headers['x-forwarded-proto'] = 'https';

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method || 'GET') ? undefined : req,
      duplex: 'half',
      redirect: 'manual',
    });

    res.status(upstream.status);
    for (const [key, value] of upstream.headers) {
      if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase()) && key.toLowerCase() !== 'set-cookie') {
        res.setHeader(key, value);
      }
    }
    const cookies = upstream.headers.getSetCookie?.() || (upstream.headers.get('set-cookie') ? [upstream.headers.get('set-cookie')] : []);
    if (cookies.length) res.setHeader('set-cookie', cookies);

    const body = Buffer.from(await upstream.arrayBuffer());
    return res.send(body);
  } catch (error) {
    console.error('API proxy failed', { message: error.message, backend: baseUrl });
    return res.status(502).json({
      message: 'The application backend could not be reached. Check BACKEND_URL and backend health.',
    });
  }
}
