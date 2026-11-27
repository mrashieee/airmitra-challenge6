# AirMitra iOS shell

This is a **Capacitor shell** for the hosted PWA. It loads
`https://airmitra-app.vercel.app` in a WKWebView, so the profile stays on the
device and the API keys stay server-side.

It is intentionally not committed as a generated Xcode project: the iOS project
must be generated and built on macOS.

## Build on macOS

```bash
cd packaging/ios
npm install
npx cap add ios
npx cap sync ios
open ios/App/App.xcworkspace
```

You need Xcode, CocoaPods and an Apple Developer account for a device or
TestFlight build. The CI workflow builds only an **unsigned simulator app**;
that is useful for development, not for App Store distribution.

## Shipping reality

- App Store distribution requires an Apple Developer Program membership,
  signing certificates, provisioning profiles and App Store review.
- A thin remote-WebView wrapper can be rejected under App Store guideline 4.2
  (“minimum functionality”). The reliable iOS path today is **Add to Home
  Screen** from Safari, which uses the existing PWA.
- A native wrapper makes sense only if we add iOS-specific functionality
  (widgets, notifications, HealthKit, offline packs, etc.).
