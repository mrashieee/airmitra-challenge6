# AirMitra desktop shell

A small Electron wrapper for the live PWA at
`https://airmitra-app.vercel.app`.

It intentionally loads the hosted app instead of bundling the Next.js server,
so the CPCB/OpenAQ/Gemini keys stay server-side. The profile remains in the
device's local storage; no account or cloud profile is created.

## Run

```bash
npm install
npm start
```

## Build

```bash
npm run dist:linux   # dist/AirMitra-1.0.0-x86_64.AppImage
npm run dist:win     # dist/AirMitra-1.0.0-Setup.exe
```

Windows builds from Linux need Wine. The CI workflow builds each target on its
native runner and uploads the artifacts.

The produced binaries are **not committed** (they are about 120 MB each). Use
the workflow artifacts or a desktop release to distribute them.

## Notes

- The wrapper only allows the AirMitra origin. Other links open in the default
  browser.
- Geolocation is allowed only for "use my location"; all other permissions are
  denied by default.
- The PWA service worker caches the shell. Live AQI and AI answers still need a
  network connection; the profile stays on the device.
