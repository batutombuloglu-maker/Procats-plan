# Doğrulama · 1 Kasım 2026

Uygulama mantık testleri: **202/202** geçti. Firestore yerel testleri: **96 kontrol** geçti (45 mevcut güvenlik/silme, 26 listeler, 25 yeni Bilgi Hazinesi). Windows: **7/7** geçti. Android birim/Robolectric testleri: **42/42** geçti. Test günlüklerinde görünen PERMISSION_DENIED satırları, yetkisiz isteklerin reddedilmesini bekleyen güvenlik testleridir.

Yeni bölümde doğrulananlar: kart doğrulama, kategori ve Türkçe arama, etiketler, tekrar aralıkları, eski form/puanlama koruması, ilişkili kart silme, görsellerin parçalara bölünmesi, iki cihazın bağımsız düzenlemelerinin birleşmesi, çakışmada iki sürümün korunması, çevrimdışı yeniden açılış, başka sekmenin eşitlenmemiş kaydı, şifreli büyük görsel yedeğinin açılıp hazırlanması, hesap ayrımı, atomik belge revizyonları ve hesap silme.

Yerel tarayıcıda misafir modunda bilgi ekleme, kelime ayrıntıları, kategori/etiket arama, ilişkilendirme, soru/cevap geçişi, Bilemedim sonrası tekrar, söz/şiir ezber görünümü ve PNG seçip JPEG'e küçültme denendi. 390×844 telefon görünümü ve masaüstü görünümü kontrol edildi. Örnek kartlar yalnız test tarayıcısındadır; paket yeni kuruluma bu örnekleri eklemez. Son kontrol sırasında tarayıcı konsolunda hata görünmedi.

Telefon ve saat önizleme/yayın APK'ları ile AAB'ler üretildi. AAB yapısı, sürüm adları/kodları, özgün yükleme sertifikası ve paketlenmiş 115 web dosyasının birebir bütünlüğü kontrol edildi. Windows ASAR içindeki 115 web dosyası ve kabuk dosyaları kaynaklarla eşleşti. Ayrıntılar paket-dogrulama.json içinde.

Android lint: telefon 0 hata / 47 uyarı; saat 0 hata / 3 uyarı. Mevcut kaynak/yardımcı metin ve derleme önerileri dahil bütün uyarılar giderildi sayılmadı. Windows EXE'leri yayıncı sertifikasıyla imzalı değildir.

Gerçek telefon/Galaxy Watch bağlı olmadığı için fiziksel cihaz, Bluetooth/Data Layer, gerçek bildirim, üretici pil yönetimi ve uzun süreli kullanım testi yapılmadı. Firebase testleri yerel emülatördeydi; canlı projeye bu sürüm yayımlanmadı. Yayından önce kendi test hesabında ve cihazında son kontrol yap.
