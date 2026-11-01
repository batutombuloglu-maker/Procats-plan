# Procats 1.7.3

Bilgi Hazinesi ve mevcut Procats özellikleri. Telefon kod 22, Wear OS kod 23. docs/1.7.3-BILGI-HAZINESI.md ve docs/TEST-SONUCLARI.md dosyalarını oku.

Node.js 22+, Java 21, Android SDK 36 gerekir. npm ci, npm test, npm run test:rules, npm run android:sync komutları kullanılır. Android testleri: android klasöründe gradlew :companion:testDebugUnitTest :app:testDebugUnitTest :wear:testDebugUnitTest. scripts/release.mjs yayın APK/AAB'lerini üretir; Play'e göndermez.

Yayın için özgün özel imza anahtarını kullan. PROCATS_KEYSTORE_FILE, PROCATS_KEYSTORE_PASSWORD, PROCATS_KEY_ALIAS, PROCATS_KEY_PASSWORD ortam değişkenlerinin dördü veya özel signing/keystore.properties gerekir. Anahtar/parola bu arşive konmadı. Yeni anahtar üretme. Android local.properties dosyasını kendi SDK yolunla oluştur.

Bilgi Hazinesi Firestore kurallarının da güncellenmesini gerektirir. Görevler ve listeler mevcut ayrı şemalarında kalır. Hazine bağımsız manifest + dört veri belgesine atomik yazılır. Mevcut Wear OS ve araç işlevleri korunmuştur. Fiziksel saat eşleme testi ayrıca gerekir.
