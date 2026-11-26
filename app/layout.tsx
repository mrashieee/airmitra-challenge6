import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
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
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    title: "AirMitra",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f7f4",
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
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <head>
        <meta name="color-scheme" content="light" />
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var m=localStorage.getItem("airmitra.motion.v1");if(m==="on")document.documentElement.classList.add("motion-on");if(m==="off")document.documentElement.classList.add("motion-off");}catch(e){}',
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
