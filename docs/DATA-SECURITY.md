# Data ownership and security boundaries

This public source repository contains no account database, session, signing key, production Firebase configuration or personal backup. The screenshots use fictional local QA entries. Runtime user data is not read or uploaded by the source-publication process.

## Accounts and synchronization

Firestore rules permit reads/writes only for the verified owner of the account. Revisions prevent silent stale overwrites. Knowledge Collection reuses the existing archive transport across a manifest and four bounded shards. Collection records have a separate marker, and the app preserves older archive records for backups and account deletion. Current-account checks are repeated before remote operations. Device journals separate accounts, preserve offline drafts and block an exit that would discard pending records. Conflict resolution keeps recovery copies.

Cloud records are not end-to-end encrypted; project administrators can technically access the Firebase project. A source-code repository is not a backup of private application records.

## Backups and recovery

The Data Vault exports authenticated encrypted backups using AES-256-GCM, PBKDF2-SHA256 with 600,000 iterations, a random 16-byte salt and a random 12-byte IV. Keep the backup password separately. The offline recovery tool uses the exact same implementation, rejects wrong passwords/tampered ciphertext, refuses to overwrite existing output and leaves the encrypted original unchanged. Recovered JSON is ordinary unencrypted personal data and must stay outside Git.

Before updating or switching installations, make a Data Vault backup and verify that it can be opened. Keep independent copies outside the application device. Firebase synchronization alone does not protect against an intentional deletion synchronized to all devices. Custom background photos are device-only and are not included in workspace backups; retain their original files separately.

## Personal Android build

The release-like personal variant uses its own application ID, disabled debugging, disabled Android OS backup and no cleartext application traffic. It can coexist with the Play installation. The launcher/share entry and Google Wearable service have necessary exported behavior; internal data/alarm components remain private as configured. A future in-place APK update requires the same application ID and signing certificate; keep the private original signing material outside this repository.

## Validation and limits

The current snapshot passed automated authorization, cross-device merge, offline journal, backup and input-validation tests, plus focused checks of compiled APK security flags and signatures. Legacy archive backup limits are 2,000 cards and 2,000,000 bytes, including compressed images. These controls are not a penetration-test certification or a guarantee of indefinite retention. Physical device and long-term recovery checks remain important.
