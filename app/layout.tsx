import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://airmitra-app.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AirMitra — Household Air Coach",
    template: "%s · AirMitra",
  },
  description:
    "AirMitra tells your family what to do about the air — for your people, your home, and your routine — and why it matters.",
  applicationName: "AirMitra",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "AirMitra",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f2e9" },
    { media: "(prefers-color-scheme: dark)", color: "#070a08" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <head>
        <meta name="color-scheme" content="light" />
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var t=localStorage.getItem("airmitra.theme.v1")||"system";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");var m=localStorage.getItem("airmitra.motion.v1");if(m==="on")document.documentElement.classList.add("motion-on");if(m==="off")document.documentElement.classList.add("motion-off");}catch(e){}',
          }}
        />
      </head>
      <body className="min-h-dvh bg-paper text-ink">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
