# Security

This document describes security measures in the 90s Arcade project and how to keep the site stable and secure when hosting.

## What’s included in the repo

### Client-side (browser)

- **Rate limiting** (`js/security.js`): Throttles rapid clicks and keypresses to reduce impact of scripts or bots (e.g. cap actions per second).
- **Secure session storage**: High scores are read/written through a wrapper that:
  - Only allows a fixed list of keys (e.g. `snakeBest`, `tetrisBest`).
  - Sanitizes values (numeric scores, max length) to avoid injection and storage abuse.
- **Secure cookie helper**: Optional `SecurityCookies.set` / `get` with safe defaults (Secure, SameSite=Lax, configurable maxAge) if you add cookies later.
- **Content Security Policy (CSP)**: Set via meta tags on every page to restrict script/style/font sources and reduce XSS risk.
- **Other meta tags**: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.

### When you host

- **Netlify**: `_headers` is applied automatically and sends security headers (X-Frame-Options, X-Content-Type-Options, etc.).
- **Vercel**: `vercel.json` defines the same headers for all routes.
- **Apache**: Use the provided `.htaccess` (ensure `AllowOverride` allows it) to send the same headers.

## DDoS and traffic abuse

This is a **static site** (HTML/CSS/JS only). There is no backend to overload. Real DDoS protection is done **at the host or CDN**:

- **Cloudflare** (in front of your domain): Turn on “Under Attack” mode or rate limiting rules to limit requests per IP and absorb floods.
- **Netlify / Vercel**: They already provide DDoS mitigation at the edge; you can add Cloudflare in front for extra limits and caching.
- **Your own server**: Put a reverse proxy (e.g. Nginx) or WAF in front with rate limiting and use HTTPS.

The in-browser rate limiting in `security.js` only reduces abuse from a single tab (e.g. automated clicks); it does **not** replace server- or CDN-level DDoS protection.

## Checklist after hosting

1. **HTTPS only**: Serve the site over HTTPS and redirect HTTP to HTTPS (many hosts do this by default).
2. **Headers**: Confirm security headers are sent (e.g. with [securityheaders.com](https://securityheaders.com)).
3. **CSP**: If you add new script or style sources, update the `Content-Security-Policy` meta tag (or server CSP header) so the site still loads.
4. **Cookies**: If you introduce cookies, use `SecurityCookies.set()` with Secure and SameSite, and prefer short-lived or session cookies.

## Reporting issues

If you find a security issue, please report it privately (e.g. to the repo owner) rather than in a public issue.
