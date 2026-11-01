# Procats Windows source — 1.7.4

Electron shell for Windows 10/11 x64. Build the shared `Procats/www` first and copy it to `Windows/www`. With Node.js 22+, run `npm ci`, `npm test` and `npm run dist`. This creates installer and portable EXEs; it does not publish them. Existing profile data is retained by the normal update path, but export an encrypted Data Vault backup before updating.

The shell uses context isolation, a limited preload bridge, restricted external navigation and download/permission rules. The supplied build has no publisher code-signing certificate. See the repository root README and security documentation for architecture and limits. Firebase Hosting updates the web client, not the interface bundled inside an EXE.
