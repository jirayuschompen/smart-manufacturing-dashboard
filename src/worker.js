// ============================================================
// Cloudflare Worker — Sungrow API Proxy
// ============================================================
// Deploy this at dash.cloudflare.com → Workers & Pages → Create Worker
//
// After deploy, copy the Worker URL (e.g. https://sungrow-proxy.xxx.workers.dev)
// and put it in your project's .env.production:
//   VITE_SUNGROW_BASE_URL=https://sungrow-proxy.xxx.workers.dev
// ============================================================

const SUNGROW_BASE = 'https://web3.isolarcloud.com.hk';
const ACCESS_KEY = 'dw7an4xui4jccjw79macpwk55y1awa9c'; // ← ตรงนี้ด้วย
const SYS_CODE     = '901';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-access-key, sys_code',
};

export default {
  async fetch(request) {

    // ── Preflight ──────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (!url.pathname.startsWith('/sungrow')) {
      return new Response('Not found', { status: 404 });
    }

    const targetPath = url.pathname.replace('/sungrow', '');
    const targetURL  = `${SUNGROW_BASE}${targetPath}`;

    try {
      const body = await request.text();

      const upstream = await fetch(targetURL, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'x-access-key':  ACCESS_KEY,
          'sys_code':      SYS_CODE,
          // ไม่ส่ง origin / referer ให้ Sungrow เพื่อไม่ให้ถูก block
        },
        body,
      });

      const text = await upstream.text();

      return new Response(text, {
        status:  upstream.status,
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS,
        },
      });

    } catch (err) {
      return new Response(
        JSON.stringify({ result_code: '0', result_msg: err.message }),
        {
          status:  502,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        }
      );
    }
  },
};
