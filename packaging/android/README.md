# AirMitra Android APK

The shippable APK is a **Trusted Web Activity (TWA)** around
`https://airmitra-app.vercel.app`. It uses the existing PWA manifest, icons and
service worker. The profile stays on the device; there is no account.

The TWA loads the live site, so it includes the separate **home / current
location** flow and the GPS button. Home is saved in the profile; the current
location is transient and never overwrites home.

The signed APK is published at:

[https://github.com/mrashieee/airmitra-challenge6/releases/tag/v1.0.1](https://github.com/mrashieee/airmitra-challenge6/releases/tag/v1.0.1)

Version 1.0.1 rotates the signing key after credential exposure. Existing
1.0.0 installations must be uninstalled before installing 1.0.1.

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
  --ks-key-alias airmitra \
  --ks-pass env:ANDROID_KEYSTORE_PASSWORD \
  --key-pass env:ANDROID_KEY_PASSWORD \
  --out AirMitra.apk aligned.apk
"$BT/apksigner" verify --print-certs AirMitra.apk
```

Set `ANDROID_KEYSTORE_PASSWORD` and `ANDROID_KEY_PASSWORD` through a secret
manager or a hidden shell prompt. Never put passwords directly in commands or
commit them. On this machine, the current password is stored in the desktop
keyring under service `airmitra-android`.

The keystore is **not committed**. If you use a different keystore, update:

1. `public/.well-known/assetlinks.json` with the new SHA-256 fingerprint.
   Keep `packaging/android/assetlinks.json` in sync; it is the source copy.
2. `twa-manifest.json` signing key alias/path if you use Bubblewrap's build.

## TWA verification

The site must serve:

`https://airmitra-app.vercel.app/.well-known/assetlinks.json`

with the package name `app.airmitra.twa` and the signing certificate SHA-256.
Without it the app still opens, but in a Chrome Custom Tab with a URL bar.
