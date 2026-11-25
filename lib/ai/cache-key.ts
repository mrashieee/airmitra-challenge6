import { createHash } from "node:crypto";

export function keyFor(prefix: string, value: string): string {
  return `${prefix}:${createHash("sha1").update(value).digest("hex")}`;
}
