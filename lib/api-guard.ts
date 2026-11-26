import type { NextRequest } from "next/server";

const MAX_BODY_BYTES = 64 * 1024;
const BUCKETS = new Map<string, { count: number; reset: number }>();

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "anonymous";
}

export function rateLimit(
  scope: string,
  request: NextRequest,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfter: number } {
  const key = `${scope}:${clientKey(request)}`;
  const now = Date.now();
  let bucket = BUCKETS.get(key);

  if (!bucket || bucket.reset <= now) {
    bucket = { count: 0, reset: now + windowMs };
    BUCKETS.set(key, bucket);

    if (BUCKETS.size > 2_000) {
      for (const [entryKey, entry] of BUCKETS) {
        if (entry.reset <= now) BUCKETS.delete(entryKey);
      }
    }
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((bucket.reset - now) / 1000)),
    };
  }
  return { ok: true };
}

export function limited(retryAfter: number): Response {
  return Response.json(
    { error: "Too many requests. Try again shortly." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

export async function readJson<T>(
  request: NextRequest,
): Promise<{ data: T } | { error: Response }> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return {
      error: Response.json({ error: "Payload too large" }, { status: 413 }),
    };
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return {
      error: Response.json({ error: "Invalid request" }, { status: 400 }),
    };
  }

  if (text.length > MAX_BODY_BYTES) {
    return {
      error: Response.json({ error: "Payload too large" }, { status: 413 }),
    };
  }

  try {
    return { data: JSON.parse(text) as T };
  } catch {
    return {
      error: Response.json({ error: "Invalid JSON" }, { status: 400 }),
    };
  }
}

/** Plain text from users: strip control characters and cap the length. */
export function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/** Coordinates inside India, with a small buffer. */
export function indiaCoords(
  lat: unknown,
  lon: unknown,
): { lat: number; lon: number } | null {
  const latitude = Number(lat);
  const longitude = Number(lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < 5 || latitude > 39 || longitude < 67 || longitude > 99) {
    return null;
  }
  return { lat: latitude, lon: longitude };
}
