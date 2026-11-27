# AirMitra Android APK

The shippable APK is a **Trusted Web Activity (TWA)** around
`https://airmitra-app.vercel.app`. It uses the existing PWA manifest, icons and
service worker. The profile stays on the device; there is no account.

The signed APK is published at:

`../docs/download/AirMitra-1.0.0.apk`

## Rebuild

Requirements: Node 20+, JDK 17/21, Android SDK with build-tools and a platform.

```bash
npm install
node generate.mjs                 # writes ./twa
cd twa
printf 'sdk.dir=/path/to/Android/Sdk\n' > local.properties
export JAVA_HOME=/path/to/jdk-21
export ANDROID_HOME=/path/to/Android/Sdk
./gradlew assembleRelease
```

Then align and sign with your own keystore:

```bash
BT="$ANDROID_HOME/build-tools/36.0.0"
"$BT/zipalign" -f 4 app/build/outputs/apk/release/app-release-unsigned.apk aligned.apk
"$BT/apksigner" sign \
  --ks ../../secrets/android.keystore \
  --ks-pass pass:YOUR_PASSWORD \
  --key-pass pass:YOUR_PASSWORD \
  --out AirMitra.apk aligned.apk
"$BT/apksigner" verify --print-certs AirMitra.apk
```

The keystore is **not committed**. If you use a different keystore, update:

1. `public/.well-known/assetlinks.json` with the new SHA-256 fingerprint.
2. `twa-manifest.json` signing key alias/path if you use Bubblewrap's build.

## TWA verification

The site must serve:

`https://airmitra-app.vercel.app/.well-known/assetlinks.json`

with the package name `app.airmitra.twa` and the signing certificate SHA-256.
Without it the app still opens, but in a Chrome Custom Tab with a URL bar.
