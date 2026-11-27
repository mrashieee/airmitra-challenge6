# Packaging AirMitra

AirMitra is a Next.js PWA with server-side AQI, search and AI routes. The
packaged apps therefore **wrap the hosted app** instead of bundling the server.
That keeps the CPCB/OpenAQ/Gemini credentials on the server and keeps the
profile on the device.

## Android — signed APK

[Download AirMitra 1.0.0 APK](https://github.com/mrashieee/airmitra-challenge6/releases/tag/apk-v1.0.0) (1.1 MB, GitHub release).

- Trusted Web Activity (TWA) around `https://airmitra-app.vercel.app`
- Package: `app.airmitra.twa`
- Uses the existing PWA manifest, icons and service worker
- Verification file: `public/.well-known/assetlinks.json`
- Source and rebuild steps: `packaging/android/README.md`

Install it on an Android phone (allow install from the browser if prompted).
The first launch needs a network connection; after that the PWA shell is cached.
The profile stays in local storage. There are no accounts.

## iOS

The practical path today is **Add to Home Screen** from Safari. A native shell
is scaffolded in `packaging/ios` with Capacitor and a macOS CI workflow, but:

- a device/TestFlight build needs macOS, Xcode, signing certificates and an
  Apple Developer account;
- App Store review can reject a thin remote-WebView wrapper under guideline 4.2.

The iOS workflow only produces an unsigned simulator app for development.

## Desktop — Linux AppImage and Windows .exe

The Electron shell lives in `packaging/desktop`.

- Linux: `npm run dist:linux` → `AirMitra-1.0.0-x86_64.AppImage`
- Windows: `npm run dist:win` → `AirMitra-1.0.0-Setup.exe`

Both are built and attached to the
[desktop-v1.0.0 release](https://github.com/mrashieee/airmitra-challenge6/releases/tag/desktop-v1.0.0).
They are intentionally **not committed** (about 120 MB each). The
`.github/workflows/desktop.yml` workflow can rebuild them on the native GitHub
runners.

The wrapper loads the hosted app, opens external links in the browser, and
allows geolocation only for "use my location".

## Cache and privacy

- Profile and settings: device-only `localStorage`.
- App shell/static assets: service worker cache.
- Live AQI and AI answers: network required; the last reading is not presented
  as live when offline.
- No accounts, no analytics, no PII, no ads.
