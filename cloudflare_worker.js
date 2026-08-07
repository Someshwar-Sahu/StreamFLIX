// Cloudflare Worker for StreamFlix Backblaze B2 CDN Proxy
// Deployed at: https://streamflix-cdn.a93767093.workers.dev

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // 1. Root health check
    if (url.pathname === "/" || url.pathname === "") {
      return new Response("StreamFlix Cloudflare CDN Proxy is Active & Live 🚀", {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // 2. Handle CORS Preflight Requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // 3. Target your Backblaze B2 us-east-005 endpoint
    const b2Origin = "https://s3.us-east-005.backblazeb2.com";
    const targetUrl = new URL(url.pathname + url.search, b2Origin);

    // 4. Forward Range headers for video scrubbing
    const newHeaders = new Headers(request.headers);
    newHeaders.set("Host", "s3.us-east-005.backblazeb2.com");

    // 5. Fetch from Backblaze B2 over Bandwidth Alliance ($0 Egress)
    const response = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: newHeaders,
      cf: {
        cacheEverything: true,
        cacheTtl: 2592000,
      },
    });

    // 6. Attach CORS headers for video streaming
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "*");
    responseHeaders.set("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges, ETag");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  },
};
