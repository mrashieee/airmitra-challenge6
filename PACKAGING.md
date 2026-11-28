# Packaging AirMitra

AirMitra is a Next.js PWA with server-side AQI, search and AI routes. The
packaged apps therefore **wrap the hosted app** instead of bundling the server.
That keeps the CPCB/OpenAQ/Gemini credentials on the server and keeps the
profile on the device.

## Android — signed APK

[Download AirMitra 1.0.1 APK](https://github.com/mrashieee/airmitra-challenge6/releases/tag/v1.0.1) (1.1 MB, GitHub release). This security release rotates the Android signing key; uninstall any 1.0.0 installation before installing because Android cannot update across signing certificates.

- Trusted Web Activity (TWA) around `https://airmitra-app.vercel.app`
- Package: `app.airmitra.twa`
- Uses the existing PWA manifest, icons and service worker
- Verification file: `public/.well-known/assetlinks.json`
- Source and rebuild steps: `packaging/android/README.md`

Install it on an Android phone (allow install from the browser if prompted).
The first launch needs a network connection; after that the PWA shell is cached.
The profile stays in local storage. There are no accounts.

The TWA uses the live site, so the current release includes the separate
**home / current location** flow. The GPS button asks Android for location
permission only when the user taps it; home stays saved in the profile and is
edited in Settings.

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
[v1.0.0 release](https://github.com/mrashieee/airmitra-challenge6/releases/tag/v1.0.0).
They are intentionally **not committed** (about 120 MB each). The
`.github/workflows/desktop.yml` workflow can rebuild them on the native GitHub
runners.

The wrapper loads the hosted app, opens external links in the browser, and
allows geolocation only for the header GPS button. The current location is not
persisted; only the home location in the profile is saved on the device.

## Cache and privacy

- Profile, home location and settings: device-only `localStorage`.
- Current location: transient app state; it resets to home on reload and is
  never written back to the profile.
- App shell/static assets: service worker cache.
- Live AQI and AI answers: network required; the last reading is not presented
  as live when offline.
- No accounts, no analytics, no PII, no ads.

## Releases

- **v1.0.1** — Android APK only, after the Android signing-key rotation.
- **v1.0.0** — Linux AppImage and Windows installer.

Both wrap the same live app. The split is intentional: rotating the Android
signing key required a new version code and a fresh APK, while the desktop
binaries did not change.
