// Cloudflare Worker for StreamFlix Backblaze B2 CDN Proxy
// Deploy this script in your Cloudflare Dashboard -> Workers -> streamflix-cdn

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle Preflight CORS Requests
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

    // Target Backblaze B2 S3 endpoint
    const b2Origin = "https://s3.us-east-005.backblazeb2.com";
    const targetUrl = new URL(url.pathname + url.search, b2Origin);

    // Forward original request headers (especially Range headers for video scrubbing)
    const newHeaders = new Headers(request.headers);
    newHeaders.set("Host", "s3.us-east-005.backblazeb2.com");

    // Fetch from Backblaze B2 over Bandwidth Alliance ($0 Egress) with Cloudflare Edge Caching
    const response = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: newHeaders,
      cf: {
        cacheEverything: true,
        cacheTtl: 86400,
      },
    });

    // Attach permissive CORS headers to the response
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
