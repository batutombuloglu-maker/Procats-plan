# Release verification — 1 November 2026

- 238 Node application tests, 42 Android unit/Robolectric tests, 7 Windows shell security tests, and 96 local Firestore emulator checks passed.
- New checks cover map refresh, identity/review/link preservation, protected user edits, missing-country additions, idempotence, refresh-only durable commits, invalid input, shuffle-bag exhaustion/early exit/filtering, 15-day quote cooldown/pool expansion, persistent home-note edits/conflicts and read-only bounded progress models.
- The complete 197-card dataset and all 197 flag/geometry references are validated. A separate personal-style sample card survives refresh; the total stays 198. Current geography source dates and licensing are included. All tests use fictional/local or public educational data.
- Desktop/mobile UI checks cover maps, compact titles, capitals/continent filters, review/discovery separation, home-note persistence, progress mode selection and the full-screen clock. Evidence is shipped separately with the personal package.
- Phone/watch package versions, original signing certificates and security flags are checked. Bundled web-file hashes are compared against phone APK and Windows ASAR contents. Windows EXEs are not publisher-signed.
- Runtime web dependency audit: zero findings. Development/build tools retain moderate advisories (17 app, 15 Windows), with no high/critical findings in the recorded scan. No dependencies were added.
- Physical phone/watch pairing, vendor battery management, indefinite data retention and a professional penetration test are outside this validation. No production records or live deployment were used.
