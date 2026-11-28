# Security

## Reporting a vulnerability

Please report suspected vulnerabilities privately to `mrashieee@gmail.com`.
Do not open a public issue containing credentials, personal data, exploit
details, or live access tokens.

## Secret handling

- `.env`, `.env.local`, and other secret environment files are ignored by Git.
- Only `.env.example` is committed, and it must contain empty secret values.
- Gemini, OpenAQ, and data.gov.in keys are server-side secrets. Never expose
  them through `NEXT_PUBLIC_*` variables or client bundles.
- Store local passwords in a secret manager or desktop keyring. Do not put
  passwords directly in shell commands, commit messages, logs, or documentation.
- Rotate a credential immediately if it appears in terminal output, chat
  history, screenshots, logs, or a repository. Removing the value from history
  does not revoke it.

## Android signing

The Android keystore is excluded from Git. Signing passwords must be supplied
through environment variables backed by a secret manager.

AirMitra 1.0.1 rotates the Android signing certificate after credential
exposure. The 1.0.0 APK was removed from the GitHub release. Android cannot
update an installed app across signing certificates, so existing 1.0.0 users
must uninstall the old app before installing 1.0.1.

When rotating signing keys:

1. Generate and protect a new keystore.
2. Build and verify the new APK signature.
3. Update `public/.well-known/assetlinks.json` with the new SHA-256
   certificate fingerprint.
4. Deploy the updated Digital Asset Links file.
5. Remove the old APK from public release assets.
6. Publish a new version code and release notes.

## API-key rotation

If a Gemini, OpenAQ, or data.gov.in key is exposed:

1. Create a replacement key in the provider dashboard.
2. Update the Vercel environment variables for the AirMitra project.
3. Update local development secrets without committing them.
4. Verify the live app and API health endpoint.
5. Delete or disable the old provider key.
6. Review provider usage and billing for unauthorized activity.

## Location data

- Home location is stored in the device-only profile (`localStorage`) and is
  never sent to the AI routes.
- The GPS button runs only after the user grants browser/OS permission. The
  coordinates are used to resolve the current reading and are not saved as home.
- `/api/reverse` validates coordinates against India's bounding box and is
  rate-limited per IP; it does not log the coordinates.
- Current location is transient: a reload returns the app to the saved home.
- No location history is stored, and there are no accounts or analytics.
