# Procats 2.1.1 verification

Run `npm test` in `Procats` for shared application checks and in `Windows` for desktop checks. The personal release package records actual test counts and build results in `07-Kontroller`.

The package checks verify the Android and Wear OS package IDs, version codes, and signing certificate. The bundled Android and Windows web assets are compared against the release web build. Device tests require a physical phone or watch.

Collection regression checks cover preserving card memberships after a rename and retaining cards after deletion. Check the browser report for the right-click menu, the equivalent three-dot menu, and the card label dots.
