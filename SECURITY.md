# Security

## Reporting

Please open a private GitHub security advisory on this repository rather than a
public issue.

## Practices

- Secrets are server-side only and read from environment variables. `.env` is
  gitignored; `.env.example` contains placeholders only.
- The browser never receives provider keys. AI and data calls happen in route
  handlers.
- AI routes accept only an allow-listed profile shape, with string lengths and
  array sizes capped before the prompt is built.
- AI and data routes are rate-limited per IP and reject oversized bodies.
- Coordinates are validated against India's bounding box.
- Production responses set CSP, HSTS, `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`.
  `X-Powered-By` is disabled.
- The model is instructed that context and questions are untrusted data, not
  instructions.
- No accounts, analytics, or PII. Profiles and reports are stored only in the
  browser's `localStorage`.

## If a key is exposed

Revoke and rotate it in the provider console (Google AI Studio, data.gov.in,
OpenAQ). Treat any key committed to git history as compromised even after the
file is edited.
