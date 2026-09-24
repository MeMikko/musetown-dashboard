// Cloudflare Pages Function — read-only proxy to api.musetown.app
// Route: /api/*  ->  https://api.musetown.app/api/*
//
// Why: keeps the browser talking to one origin (no CORS surprises, no mixed
// content), lets us add edge caching, and gives a single place to rate-limit
// or block paths later. The upstream API is public and read-only here.

const UPSTREAM = 'https://api.musetown.app';

// Only these upstream paths may be proxied. Everything else 404s.
const ALLOWED = [
  /^\/api\/seasons$/,
  /^\/api\/seasons\/eligibility$/,
  /^\/api\/land$/,
  /^\/api\/bank$/,
  /^\/api\/mayor$/,
  /^\/api\/city$/,
  /^\/api\/casino$/,
  /^\/api\/owners\/residents$/,
];

// Seconds to cache at the edge per path.
function ttl(path) {
  if (path === '/api/seasons') return 30;
  if (path === '/api/land') return 60;
  if (path === '/api/bank') return 60;
  if (path === '/api/mayor') return 30;
  if (path === '/api/city') return 300;
  return 60;
}

export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return json({ ok: false, error: 'Method not allowed' }, 405);
  }

  const path = '/api/' + (Array.isArray(params.path) ? params.path.join('/') : (params.path || ''));
  if (!ALLOWED.some((re) => re.test(path))) {
    return json({ ok: false, error: 'Path not proxied', path }, 404);
  }

  const target = UPSTREAM + path + (url.search || '');
  const cache = caches.default;
  const cacheKey = new Request(target, { method: 'GET' });

  let res = await cache.match(cacheKey);
  if (!res) {
    const upstream = await fetch(target, {
      method: 'GET',
      headers: { accept: 'application/json', 'user-agent': 'musetown-dashboard/1.0' },
      cf: { cacheTtl: ttl(path), cacheEverything: true },
    });
    res = new Response(upstream.body, upstream);
    if (upstream.ok) {
      res.headers.set('cache-control', 'public, max-age=' + ttl(path) + ', s-maxage=' + ttl(path));
      context.waitUntil(cache.put(cacheKey, res.clone()));
    }
  }

  const out = new Response(res.body, res);
  out.headers.set('access-control-allow-origin', '*');
  out.headers.set('x-proxied-by', 'musetown-dashboard');
  return out;
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
  });
}
