// Response headers for every page: no framing by other sites, and only the
// sources this site actually uses: its own files, the Google Fonts typeface and
// Cloudflare Web Analytics, which Cloudflare adds to pages at the edge.
const SECURITY_HEADERS = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://cloudflareinsights.com; frame-ancestors 'none'; base-uri 'self'; form-action 'none'; object-src 'none'",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "www.pegcanvas.com") {
      url.hostname = "pegcanvas.com";
      return Response.redirect(url.toString(), 301);
    }
    const asset = await env.ASSETS.fetch(request);
    const response = new Response(asset.body, asset);
    for (const [name, value] of Object.entries(SECURITY_HEADERS))
      response.headers.set(name, value);
    return response;
  }
};
