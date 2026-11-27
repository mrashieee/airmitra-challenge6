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

## Room Check

Room Check stores host passwords as scrypt hashes and signs sessions with a
separate session secret. Resetting the host password also removes the session
secret and invalidates existing host sessions after restart.
