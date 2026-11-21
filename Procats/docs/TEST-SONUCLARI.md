# Procats 2.1.3 verification

Run `npm test` in `Procats` for shared application checks and in `Windows` for desktop checks. The personal release package records actual test counts and build results in `07-Kontroller`.

The package checks verify the Android and Wear OS package IDs, version codes, and signing certificate. The bundled Android and Windows web assets are compared against the release web build. Device tests require a physical phone or watch.

225 application tests and 7 Windows tests passed. The web build, Android App Bundle, personal Android/Wear APKs, and Windows installers completed successfully. All 121 bundled web assets match the release build.

Browser checks covered card actions in custom and built-in collections, editing while preserving multiple memberships, right-click and Escape, cancelling deletion, persistence after reload, and deleting a synthetic test card. No personal records were modified. Physical phone and watch testing was not performed for this patch; native functionality is unchanged.
