# Procats application source — 1.7.4

Shared web interface and Android/Companion/Wear OS modules. See the repository root README for architecture, screenshots and installation commands, [Knowledge Treasury notes](docs/1.7.4-BILGI-HAZINESI.md) for behavior, and [validation](docs/TEST-SONUCLARI.md) for test coverage.

Use Node.js 22+, Java 21 and Android SDK 36. Run `npm ci`, `npm test`, `npm run build` and `npm run preview`. Local Firestore tests use `npm run test:rules` with the demo project. For Android, run `npm run android:sync`, configure your own SDK path in `android/local.properties`, then build the required variant with Gradle.

Personal phone/watch packages use `com.procats.study.personal`; debug packages use `.preview`. Signed personal builds require the original private keystore and its four environment variables (`PROCATS_KEYSTORE_FILE`, `PROCATS_KEYSTORE_PASSWORD`, `PROCATS_KEY_ALIAS`, `PROCATS_KEY_PASSWORD`) or a private signing configuration. No signing keys or passwords are supplied here. The `scripts/release.mjs` helper is retained as source tooling; preparing this personal release does not upload to any app store.

The public repository uses example Firebase configuration. To connect your own account service, copy `public/firebase-config.example.js` to the Git-ignored `public/firebase-config.js`, fill your own Firebase web settings, update `.firebaserc` and `publisher.json`, and deploy the owner-only Firestore rules. The personal delivery keeps the user's existing client configuration separately; never commit private runtime records or backups.
