import { cn } from "@/lib/ui";

/** AirMitra brand mark: a cream A with a wind crossbar on deep pine. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      role="img"
      aria-label="AirMitra"
      className={cn("shrink-0", className)}
    >
      <rect width="512" height="512" rx="112" fill="#0C5B4C" />
      <path
        d="M144 392 256 120l112 272"
        fill="none"
        stroke="#F5F2E9"
        strokeWidth="44"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M188 302c42-24 94-24 136 0"
        fill="none"
        stroke="#A7D8C9"
        strokeWidth="26"
        strokeLinecap="round"
      />
    </svg>
  );
}
