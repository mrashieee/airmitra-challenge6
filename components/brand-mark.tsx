import { cn } from "@/lib/ui";

/** AirMitra brand mark: a house with an air line. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      role="img"
      aria-label="AirMitra"
      className={cn("shrink-0", className)}
    >
      <rect width="512" height="512" rx="112" fill="#0B3B36" />
      <path
        d="M128 264 256 150l128 114"
        fill="none"
        stroke="#F3EFE5"
        strokeWidth="30"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M168 304h176c22 0 38 16 38 35s-16 35-38 35"
        fill="none"
        stroke="#7DD3C7"
        strokeWidth="24"
        strokeLinecap="round"
      />
      <path
        d="M196 348h108"
        fill="none"
        stroke="#F3EFE5"
        strokeWidth="18"
        strokeLinecap="round"
        opacity=".75"
      />
    </svg>
  );
}
