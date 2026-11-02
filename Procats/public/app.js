

        // Defensive storage: invalid records remain recoverable and are never overwritten on load.
        const blockedStorageKeys = new Set();
        let dataImportPending = false;
        let storageWarningShown = false;
        function warnStorage() {
            if (storageWarningShown) return;
            storageWarningShown = true;
            setTimeout(() => showCustomAlert(t('storage_error')), 0);
        }
        const appStorage = {
            getItem(key) {
                try { return window.procatsStorage.getItem(key); }
                catch { blockedStorageKeys.add(key); warnStorage(); return null; }
            },
            setItem(key, value) {
                if (dataImportPending || blockedStorageKeys.has(key)) return false;
                try { window.procatsStorage.setItem(key, value); return true; }
                catch (error) { if(error.message==='backup-size')showSyncLimit();else warnStorage();return false; }
            },
            removeItem(key) {
                if (dataImportPending || blockedStorageKeys.has(key)) return false;
                try { window.procatsStorage.removeItem(key); return true; }
                catch { warnStorage(); return false; }
            }
        };
        const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
        const isId = value => typeof value === 'number' && Number.isFinite(value) && value > 0;
        const isCount = value => Number.isInteger(value) && value >= 0;
        const isTimestamp = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 8640000000000000;
        const isTime = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
        const isDateKey = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
        function validData(key, value) {
            if (key === 'procats_activity_v1') return ProcatsActivity.valid(value);
            if (key === 'procats_lists_v1') return ProcatsListsCore.valid(value);
            if (key === 'procats_knowledge_v1') {try{return !!ProcatsKnowledgeCore.check(value);}catch{return false;}}
            if (key === 'procats_navigation_v1') return ProcatsNavigation.valid(value);
            if (key === 'procats-device-settings-v1') return isRecord(value) && typeof value.examsVisible === 'boolean' && ['sound','vibrate','silent'].includes(value.timerMode) && typeof value.wakeScreen === 'boolean';
            if (key === 'procats_exams_v1') return validateExamRecords(value);
            if (key === 'procats_exam_selection_v1') return ProcatsExamData.validSelection(value);
            const arrays = {
                procats_folders: ['name'], yks_v3_days: ['name'], yks_v3_tasks: ['title'],
                yks_v5_notes: ['text'], yks_v7_bookmarks: ['title', 'url'], yks_v8_archives: ['title'],
                procats_obs_folders: ['name'], procats_obs_notes: ['name'], procats_reminders: ['text']
            };
            if (Object.hasOwn(arrays, key)) {
                if (!Array.isArray(value)) return false;
                const ids = new Set();
                return value.every(item => {
                    if (!isRecord(item) || !isId(item.id) || ids.has(item.id)) return false;
                    ids.add(item.id);
                    if (!arrays[key].every(field => typeof item[field] === 'string')) return false;
                    for (const field of ['completed', 'missed', 'isExempt', 'isLinkedToNext', 'expanded', 'active']) {
                        if (item[field] !== undefined && typeof item[field] !== 'boolean') return false;
                    }
                    if (item.folderId != null && !isId(item.folderId)) return false;
                    if (key === 'yks_v3_days' && item.date != null && !isExamDate(item.date)) return false;
                    if (key === 'yks_v3_tasks') {
                        if (!isId(item.dayId) || (item.desc != null && typeof item.desc !== 'string')) return false;
                        if (item.rating != null && (!isCount(item.rating) || item.rating > 10)) return false;
                        if (item.activityDate != null && !isDateKey(item.activityDate)) return false;
                        if (item.completedDate != null && !isDateKey(item.completedDate)) return false;
                    }
                    if (key === 'procats_obs_notes' && item.content != null && typeof item.content !== 'string') return false;
                    if (key === 'yks_v8_archives') {
                        if (!['book', 'movie', 'game'].includes(item.type) || !isCount(item.score) || item.score > 10) return false;
                        for (const field of ['date', 'summary', 'comment', 'meta1', 'meta2', 'meta3', 'meta4']) {
                            if (item[field] != null && !['string', 'number'].includes(typeof item[field])) return false;
                        }
                    }
                    if (key === 'procats_reminders') {
                        if (!['mat', 'fiz', 'kim', 'biy', 'edb', 'tar', 'gen'].includes(item.categoryId) || !isTimestamp(item.expireDate)) return false;
                        if (item.timesPerDay != null && (!isCount(item.timesPerDay) || item.timesPerDay < 1)) return false;
                        if (item.timesSentToday != null && !isCount(item.timesSentToday)) return false;
                        if (item.minIntervalHours != null && !(Number.isFinite(item.minIntervalHours) && item.minIntervalHours > 0)) return false;
                        if (item.startTime != null && !isTime(item.startTime)) return false;
                        if (item.endTime != null && !isTime(item.endTime)) return false;
                        if (item.lastSentTimestamp != null && !isTimestamp(item.lastSentTimestamp)) return false;
                    }
                    return true;
                });
            }
            if (key === 'yks_v6_activity') return isRecord(value) && Object.entries(value).every(([date, count]) => isDateKey(date) && isCount(count));
            if (key === 'procats_bot_settings') return isRecord(value) && typeof value.token === 'string' &&
                ['string', 'number'].includes(typeof value.chatId) && (value.lastSentTime == null || isTimestamp(value.lastSentTime));
            if (key === 'procats_sw') return isRecord(value) && typeof value.isRunning === 'boolean' && isTimestamp(value.startTime) && isTimestamp(value.savedTime);
            if (key === 'procats_timer') return isRecord(value) && typeof value.isRunning === 'boolean' && isTimestamp(value.endTime) && isCount(value.remainingTime);
            if (key === 'procats_lang') return ['tr', 'en', 'de'].includes(value);
            if (key === 'procats_theme') return ["default","cream","light","dark","alpine","solar","velvet","swan","heritage","starlit","hibiscus","lily","starry","vinyl","oled","hacker","crimson"].includes(value);
            if (key.endsWith('sidebarWidth')) return typeof value === 'string' && /^\d+(\.\d+)?px$/.test(value) && parseFloat(value) >= 220 && parseFloat(value) <= 600;
            return false;
        }
        // Older copies could create two tasks in the same millisecond.
        // Task IDs have no child references: preserve every record and only replace repeated IDs.
        function normalizeLegacyData(key, value) {
            if (key !== 'yks_v3_tasks' || !Array.isArray(value)) return value;
            if (!value.every(item => isRecord(item) && isId(item.id))) return value;
            const reserved = new Set(value.map(item => item.id));
            if (reserved.size === value.length) return value;
            const seen = new Set();
            let nextId = 1;
            for (const item of value) {
                if (item.id < Number.MAX_SAFE_INTEGER) nextId = Math.max(nextId, Math.floor(item.id) + 1);
            }
            return value.map(item => {
                if (!seen.has(item.id)) { seen.add(item.id); return item; }
                while (reserved.has(nextId)) {
                    nextId = nextId < Number.MAX_SAFE_INTEGER ? nextId + 1 : 1;
                }
                const repaired = {...item, id: nextId};
                reserved.add(nextId);
                nextId = nextId < Number.MAX_SAFE_INTEGER ? nextId + 1 : 1;
                return repaired;
            });
        }
        function readStoredJSON(key, fallback) {
            const raw = appStorage.getItem(key);
            if (raw === null) return fallback;
            try {
                const value = normalizeLegacyData(key, JSON.parse(raw));
                if (value === null) return fallback;
                if (!validData(key, value)) throw new Error('Invalid stored data');
                return value;
            } catch { blockedStorageKeys.add(key); warnStorage(); return fallback; }
        }
        function escapeHtml(value) {
            return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
        }
        function localDate(date = new Date()) {
            return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }
        let lastGeneratedId = Date.now() * 1000;
        function createId() { lastGeneratedId = Math.max(Date.now() * 1000 + crypto.getRandomValues(new Uint16Array(1))[0] % 1000, lastGeneratedId + 1); return lastGeneratedId; }

        // --- 1. LANGUAGE (i18n) & QUOTES SYSTEM
        const dict = {
            tr: {
                menu_themes: "TEMALAR", theme_dark: "Klasik Koyu", theme_light: "Açık Tema", theme_oled: "Derin Siyah", theme_hacker: "Siber Güvenlik", theme_crimson: "Kızıl Gece", menu_lang: "DİL / LANGUAGE",
                ctx_new_folder: "Yeni Klasör Oluştur", ctx_new_day: "İçine Gün Ekle", ctx_rename: "Yeniden Adlandır", ctx_delete: "Sil", ctx_copy: "Kopyala", ctx_move: "Klasöre Taşı", ctx_edit: "Düzenle", ctx_link: "Sonrakiyle Bağla (Blok)", ctx_exempt: "Isı Haritasından Muaf Tut",
                btn_start: "Başlat", btn_reset: "Sıfırla", btn_reset_all: "Sıfırla", heat_title: "Son 30 Günlük Odaklanma Isı Haritası",
                tasks_title: "Plan Günleri", btn_new_day: "+ Yeni Gün Ekle", lib_title: "Uygulama Paneli", lib_sub: "Sol taraftan ayrıntılamak için bir gün seçin.", btn_new_task: "+ Yeni Görev", progress_text: "Bu Klasördeki İlerleme",
                min: "Dk", ph_min: "Süre (Dk)", btn_set: "Ayarla", btn_pause: "Duraklat", btn_cancel: "İptal", btn_confirm: "Onayla", notes_title: "Hızlı Notlar", btn_new_note: "+ Yeni Not",
                bm_title: "Dijital Cephanelik", bm_sub: "Sık kullandığın bağlantılar ve kaynaklar.", btn_new_bm: "+ Yeni Kaynak Ekle", btn_delete: "Sil",
                arch_title: "Yaşam Arşivi", arch_sub: "Okunan kitaplar, filmler ve oyunlar.", btn_new_arch: "+ Yeni İçerik", tab_books: "Kitaplar", tab_movies: "Filmler", tab_games: "Oyunlar",
                vault_title: "Kişisel Veri Kasası", vault_sub: "Görevlerin, notların ve planların hesabınla eşitlenir. Şifreli yedek indir, bir yedeği geri yükle veya mevcutları koruyarak yeni veri ekle.", btn_export: "Veri indir", btn_import: "Yedek Yükle",
                btn_save: "Kaydet", mod_folder_title: "Klasör Oluştur", mod_folder_name: "Klasör Adı", ph_folder: "Örn: 1. Hafta", mod_day_title: "Gün Ekle", mod_day_name: "Gün Adı", ph_day: "Örn: Pazartesi", mod_day_folder: "Klasör Seçimi (Opsiyonel)", mod_task_title: "Görev Ekle / Düzenle", mod_task_name: "Görev Başlığı", ph_task: "Örn: 05.00 Kalkış", mod_task_desc: "Detaylar", ph_desc: "Açıklama...",
                mod_link_title: "Başlık", mod_link_url: "URL (Link)", mod_arch_type: "Tür Seçin", mod_arch_title: "Başlık", mod_arch_date: "Tarih", mod_arch_summary: "Özet", mod_arch_comment: "Kişisel Yorumun", mod_arch_score: "Puan (10 Üzerinden)",
                alert_time_up: "Süre Bitti! Odaklanma puanı kazanıldı.", alert_del_folder: "Klasörü ve içindekileri tamamen silmek istediğine emin misin?", alert_del_day: "Bu günü tamamen silmek istediğinize emin misiniz?", alert_del_task: "Bu görevi kalıcı olarak silmek istiyor musun?", alert_del_bm: "Bu kaynağı silmek istediğinize emin misiniz?", alert_del_arch: "Bu eseri arşivden silmek istediğine emin misin?", alert_import_warn: "DİKKAT: Yüklenen dosya mevcut verilerinin üzerine yazılacak. Onaylıyor musun?", alert_import_suc: "Veriler başarıyla geri yüklendi! Sistem yenileniyor...", alert_import_err: "Hata: Geçerli bir yedek dosyası değil.", alert_title_req: "Lütfen bir başlık girin.", root_folder: "Ana Dizin (Klasörsüz)", status_done: "✓ Tamamlandı", status_doing: "Yapılıyor...", status_missed: "Yapılmadı", status_missed_act: "İptal Edildi", no_tasks: "Görev yok. Sağ üstten ekle.",
                obs_title: "Serbest Plan", obs_empty: "Soldan bir sayfa seçin veya yeni oluşturun.",
                rem_cats: "Kategoriler", bot_offline: "Bot: Ayarlanmadı", bot_online: "Bot: Aktif 🟢", bot_settings: "⚙️ Bot Ayarları",
                rem_all: "Tüm Notlar", rem_sub: "Aralıklı tekrara bağlanan telegram bildirimleri.", btn_new_rem: "+ Yeni Hatırlatıcı",
                mod_rem_title: "Hatırlatıcı Ekle", mod_rem_cat: "Kategori", mod_rem_text: "Bilgi / Cümle", ph_rem_text: "Örn: Canlılar prokaryot ve ökaryot...", 
                mod_rem_dur_days: "Kaç Gün Sürsün?", mod_rem_per_day: "Günde Kaç Kere?", mod_rem_time_start: "Başlangıç Saati", mod_rem_time_end: "Bitiş Saati", mod_rem_interval: "Minimum Boşluk (Saat)",
                cat_mat: "Matematik", cat_fiz: "Fizik", cat_kim: "Kimya", cat_biy: "Biyoloji", cat_edb: "Edebiyat", cat_tar: "Tarih", cat_gen: "Genel",
                bot_info: "BotFather'dan aldığın Token'ı yapıştır. Sonra telefonundan botuna bir 'Merhaba' yaz ve 'Bağlantıyı Test Et' butonuna bas.",
                bot_test_suc: "Harika! Bot bağlandı ve Chat ID bulundu. Ayarları kaydedebilirsiniz.", bot_test_err: "Bağlantı kurulamadı. Token'ı doğru girdiğinden ve bota telefondan mesaj attığından emin ol.", alert_del_rem: "Bu hatırlatıcıyı silmek istediğinize emin misiniz?"
            },
            en: {
                menu_themes: "THEMES", theme_dark: "Classic Dark", theme_light: "Light Theme", theme_oled: "Deep Black", theme_hacker: "Cyber Security", theme_crimson: "Crimson Night", menu_lang: "LANGUAGE",
                ctx_new_folder: "New Folder", ctx_new_day: "Add Day Inside", ctx_rename: "Rename", ctx_delete: "Delete", ctx_copy: "Copy", ctx_move: "Move to Folder", ctx_edit: "Edit", ctx_link: "Link Next (Block)", ctx_exempt: "Toggle Heatmap Exemption",
                btn_start: "Start", btn_reset: "Reset", btn_reset_all: "Reset", heat_title: "Last 30 Days Focus Heatmap",
                tasks_title: "Plan Days", btn_new_day: "+ Add New Day", lib_title: "Application Panel", lib_sub: "Select a day from the left to view details.", btn_new_task: "+ New Task", progress_text: "Progress in this Folder",
                min: "Min", ph_min: "Time (Min)", btn_set: "Set", btn_pause: "Pause", btn_cancel: "Cancel", btn_confirm: "Confirm", notes_title: "Quick Notes", btn_new_note: "+ New Note",
                bm_title: "Digital Arsenal", bm_sub: "Frequently used links and resources.", btn_new_bm: "+ Add Resource", btn_delete: "Delete",
                arch_title: "Life Archive", arch_sub: "Books read, movies watched, and games finished.", btn_new_arch: "+ Add Content", tab_books: "Books", tab_movies: "Movies", tab_games: "Games",
                vault_title: "Personal Data Vault", vault_sub: "Your tasks, notes and plans sync with your account. You can also download a separate backup copy.", btn_export: "Export Data (.json)", btn_import: "Restore Backup",
                btn_save: "Save", mod_folder_title: "Create Folder", mod_folder_name: "Folder Name", ph_folder: "e.g., Week 1", mod_day_title: "Add Day", mod_day_name: "Day Name", ph_day: "e.g., Monday", mod_day_folder: "Select Folder (Optional)", mod_task_title: "Add / Edit Task", mod_task_name: "Task Title", ph_task: "e.g., Wake up 05:00", mod_task_desc: "Details", ph_desc: "Description...",
                mod_link_title: "Title", mod_link_url: "URL (Link)", mod_arch_type: "Select Type", mod_arch_title: "Title", mod_arch_date: "Date", mod_arch_summary: "Summary", mod_arch_comment: "Personal Comment", mod_arch_score: "Score",
                alert_time_up: "Time is up!", alert_del_folder: "Delete this folder and its contents?", alert_del_day: "Delete?", alert_del_task: "Delete this task?", alert_del_bm: "Delete this resource?", alert_del_arch: "Delete this content?", alert_import_warn: "WARNING: Overwrite existing data?", alert_import_suc: "Data restored successfully! Refreshing...", alert_import_err: "Error: Invalid backup file.", alert_title_req: "Please enter a title.", root_folder: "Root", status_done: "✓ Completed", status_doing: "In Progress...", status_missed: "Missed", status_missed_act: "Cancelled", no_tasks: "No tasks. Add from top right.",
                obs_title: "Free Plan", obs_empty: "Select a page from left or create a new one.",
                rem_cats: "Categories", bot_offline: "Bot: Not Set", bot_online: "Bot: Active 🟢", bot_settings: "⚙️ Bot Settings",
                rem_all: "All Notes", rem_sub: "Spaced repetition telegram notifications.", btn_new_rem: "+ New Reminder",
                mod_rem_title: "Add Reminder", mod_rem_cat: "Category", mod_rem_text: "Fact / Sentence", ph_rem_text: "e.g., Mitochondria is the powerhouse...", 
                mod_rem_dur_days: "Duration (Days)", mod_rem_per_day: "Times per day", mod_rem_time_start: "Start Time", mod_rem_time_end: "End Time", mod_rem_interval: "Min Interval (Hours)",
                cat_mat: "Math", cat_fiz: "Physics", cat_kim: "Chemistry", cat_biy: "Biology", cat_edb: "Literature", cat_tar: "History", cat_gen: "General",
                bot_info: "Paste your Bot Token. Send 'Hello' to your bot on your phone, then click Test Connection.",
                bot_test_suc: "Great! Bot connected and Chat ID found. You can save.", bot_test_err: "Failed to connect. Make sure Token is correct and you sent a message to the bot.", alert_del_rem: "Delete this reminder?"
            },
            de: {
                menu_themes: "THEMEN", theme_dark: "Klassisch Dunkel", theme_light: "Helles Thema", theme_oled: "Tiefes Schwarz", theme_hacker: "Cyber-Sicherheit", theme_crimson: "Rote Nacht", menu_lang: "SPRACHE",
                ctx_new_folder: "Neuer Ordner", ctx_new_day: "Tag Hinzufügen", ctx_rename: "Umbenennen", ctx_delete: "Löschen", ctx_copy: "Kopieren", ctx_move: "In Ordner Verschieben", ctx_edit: "Bearbeiten", ctx_link: "Nächstes Verknüpfen (Block)", ctx_exempt: "Von Heatmap Befreien",
                btn_start: "Start", btn_reset: "Zurücksetzen", btn_reset_all: "Zurücksetzen", heat_title: "Fokus-Heatmap der letzten 30 Tage",
                tasks_title: "Planungstage", btn_new_day: "+ Neuer Tag", lib_title: "Anwendungsbereich", lib_sub: "Wählen Sie links einen Tag für Details aus.", btn_new_task: "+ Neue Aufgabe", progress_text: "Fortschritt in diesem Ordner",
                min: "Min", ph_min: "Zeit (Min)", btn_set: "Einstellen", btn_pause: "Pause", btn_cancel: "Abbrechen", btn_confirm: "Bestätigen", notes_title: "Kurze Notizen", btn_new_note: "+ Neue Notiz",
                bm_title: "Digitales Arsenal", bm_sub: "Häufig genutzte Links und Ressourcen.", btn_new_bm: "+ Ressource Hinzufügen", btn_delete: "Löschen",
                arch_title: "Lebensarchiv", arch_sub: "Gelesene Bücher, gesehene Filme und Spiele.", btn_new_arch: "+ Inhalt Hinzufügen", tab_books: "Bücher", tab_movies: "Filme", tab_games: "Spiele",
                vault_title: "Persönlicher Datentresor", vault_sub: "Aufgaben, Notizen und Pläne werden mit deinem Konto synchronisiert. Du kannst zusätzlich eine Sicherung herunterladen.", btn_export: "Daten Exportieren (.json)", btn_import: "Backup Wiederherstellen",
                btn_save: "Speichern", mod_folder_title: "Ordner Erstellen", mod_folder_name: "Ordnername", ph_folder: "z.B. Woche 1", mod_day_title: "Tag Hinzufügen", mod_day_name: "Tagesname", ph_day: "z.B. Montag", mod_day_folder: "Ordner Wählen (Optional)", mod_task_title: "Aufgabe Hinzufügen/Bearbeiten", mod_task_name: "Aufgabentitel", ph_task: "z.B. Aufwachen 05:00", mod_task_desc: "Details", ph_desc: "Beschreibung...",
                mod_link_title: "Titel", mod_link_url: "URL (Link)", mod_arch_type: "Typ Wählen", mod_arch_title: "Titel", mod_arch_date: "Datum", mod_arch_summary: "Zusammenfassung", mod_arch_comment: "Persönlicher Kommentar", mod_arch_score: "Bewertung",
                alert_time_up: "Die Zeit ist um!", alert_del_folder: "Diesen Ordner und seinen Inhalt löschen?", alert_del_day: "Löschen?", alert_del_task: "Diese Aufgabe löschen?", alert_del_bm: "Diese Ressource löschen?", alert_del_arch: "Diesen Inhalt löschen?", alert_import_warn: "WARNUNG: Vorhandene Daten überschreiben?", alert_import_suc: "Daten erfolgreich wiederhergestellt! Aktualisiere...", alert_import_err: "Fehler: Ungültige Backup-Datei.", alert_title_req: "Bitte einen Titel eingeben.", root_folder: "Stammverzeichnis", status_done: "✓ Abgeschlossen", status_doing: "In Bearbeitung...", status_missed: "Verpasst", status_missed_act: "Abgebrochen", no_tasks: "Keine Aufgaben. Oben rechts hinzufügen.",
                obs_title: "Freier Plan", obs_empty: "Wählen Sie links eine Seite oder erstellen Sie eine neue.",
                rem_cats: "Kategorien", bot_offline: "Bot: Nicht Gesetzt", bot_online: "Bot: Aktiv 🟢", bot_settings: "⚙️ Bot Einstellungen",
                rem_all: "Alle Notizen", rem_sub: "Telegram-Erinnerungen.", btn_new_rem: "+ Neue Erinnerung",
                mod_rem_title: "Erinnerung Hinzufügen", mod_rem_cat: "Kategorie", mod_rem_text: "Fakt / Satz", ph_rem_text: "z.B. Mitochondrien sind das Kraftwerk...", 
                mod_rem_dur_days: "Dauer (Tage)", mod_rem_per_day: "Mal pro Tag", mod_rem_time_start: "Startzeit", mod_rem_time_end: "Endzeit", mod_rem_interval: "Min. Intervall (Stunden)",
                cat_mat: "Mathe", cat_fiz: "Physik", cat_kim: "Chemie", cat_biy: "Biologie", cat_edb: "Literatur", cat_tar: "Geschichte", cat_gen: "Allgemein",
                bot_info: "Füge deinen Bot-Token ein. Sende 'Hallo' an deinen Bot auf dem Telefon und klicke dann auf Verbindung testen.",
                bot_test_suc: "Toll! Bot verbunden und Chat-ID gefunden. Sie können speichern.", bot_test_err: "Verbindung fehlgeschlagen. Überprüfen Sie den Token und senden Sie eine Nachricht.", alert_del_rem: "Diese Erinnerung löschen?"
            }
        };

        
        const extraTranslations = {
            tr: {
                storage_error: 'Bazı kayıtlar okunamadı veya tarayıcıya kaydedilemedi. Mevcut kayıtların üzerine yazılmadı. Kapatmadan önce Veri Kasası üzerinden yedek alıp tarayıcının depolama ayarlarını kontrol edin.',
                invalid_url: 'Lütfen geçerli bir https:// bağlantısı girin.',
                invalid_reminder: 'Gün ve tekrar sayısı pozitif tam sayı olmalı; saatleri ve minimum boşluğu kontrol edin. Başlangıç ve bitiş saati aynı olamaz.',
                reminder_too_long: 'Hatırlatıcı en fazla 3900 karakter olabilir.',
                no_reminders: 'Burada hiç hatırlatıcı yok. Sağ üstten ekleyebilirsin.',
                rem_end: 'Bitiş', rem_today: 'Bugün', rem_finished: 'Tamamlandı', task_count: 'Görev',
                reset_heatmap: 'Isı haritasındaki tüm etkinlik kayıtları sıfırlansın mı?',
                alert_time_up: 'Süre Bitti!', progress_text: 'Bu Gündeki İlerleme',
                rem_sub: 'Uygulama açıkken aralıklı tekrara bağlanan Telegram bildirimleri.',
                bot_chat_required: 'Chat ID bulunamadı. Bota özel mesaj gönderin veya kendi Chat ID bilginizi girin.',
                invalid_bot: 'Geçerli bir Bot Token ve Chat ID girin ya da bağlantıyı test edin.',
                bot_test_suc: 'Bot doğrulandı. Ayarları Kaydet ile uygulayabilirsiniz.'
            },
            en: {
                storage_error: 'Some records could not be read or saved. Existing records were not overwritten. Export a backup from the Data Vault before closing and check browser storage settings.',
                invalid_url: 'Enter a valid https:// link.',
                invalid_reminder: 'Days and repetitions must be positive whole numbers. Check the time window and minimum interval; start and end times must differ.',
                reminder_too_long: 'A reminder can contain at most 3900 characters.',
                no_reminders: 'No reminders here. Add one from the top right.',
                rem_end: 'Ends', rem_today: 'Today', rem_finished: 'Completed', task_count: 'Tasks',
                reset_heatmap: 'Reset all heatmap activity records?', progress_text: 'Progress for this Day',
                rem_sub: 'Telegram repetition reminders while the application is open.',
                bot_chat_required: 'Chat ID was not found. Send a private message to the bot or enter your own Chat ID.',
                invalid_bot: 'Enter a valid Bot Token and Chat ID, or test the connection.',
                bot_test_suc: 'Bot verified. Apply the settings with Save.'
            },
            de: {
                storage_error: 'Einige Daten konnten nicht gelesen oder gespeichert werden. Vorhandene Daten wurden nicht überschrieben. Vor dem Schließen ein Backup im Datentresor exportieren und die Browsereinstellungen prüfen.',
                invalid_url: 'Bitte einen gültigen https://-Link eingeben.',
                invalid_reminder: 'Tage und Wiederholungen müssen positive ganze Zahlen sein. Zeitfenster und Mindestabstand prüfen; Start- und Endzeit müssen verschieden sein.',
                reminder_too_long: 'Eine Erinnerung darf höchstens 3900 Zeichen enthalten.',
                no_reminders: 'Keine Erinnerungen. Oben rechts eine hinzufügen.',
                rem_end: 'Ende', rem_today: 'Heute', rem_finished: 'Abgeschlossen', task_count: 'Aufgaben',
                reset_heatmap: 'Alle Aktivitätseinträge der Heatmap zurücksetzen?', progress_text: 'Fortschritt für diesen Tag',
                rem_sub: 'Telegram-Wiederholungen, während die Anwendung geöffnet ist.',
                bot_chat_required: 'Chat-ID nicht gefunden. Dem Bot privat schreiben oder die eigene Chat-ID eingeben.',
                invalid_bot: 'Gültigen Bot-Token und Chat-ID eingeben oder die Verbindung testen.',
                bot_test_suc: 'Bot bestätigt. Die Einstellungen mit Speichern übernehmen.'
            }
        };
        Object.keys(extraTranslations).forEach(lang => Object.assign(dict[lang], extraTranslations[lang]));

        const examTranslations = {
            tr: {
                exam_title: 'Denemeler', exam_subtitle: 'Ders sonuçların ve net gelişimin.', exam_new: '+ Yeni Deneme', exam_new_title: 'Yeni Deneme', exam_edit_title: 'Denemeyi Düzenle',
                exam_track: 'Alan', exam_say: 'Sayısal', exam_ea: 'Eşit Ağırlık', exam_soz: 'Sözel', exam_all: 'Tüm testler', exam_trend: 'Net gelişimi', exam_subject: 'Ders', exam_records: 'Deneme kayıtları',
                exam_name: 'Deneme adı / yayın', exam_name_hint: 'Örn: TYT Genel Deneme 1', exam_date: 'Deneme tarihi', exam_type: 'Deneme türü', exam_results: 'Ders sonuçları', exam_formula: 'Net = Doğru − Yanlış / 4',
                exam_correct: 'Doğru', exam_wrong: 'Yanlış', exam_blank: 'Boş', exam_total: 'Toplam net', exam_questions: 'soru', exam_count: 'deneme', exam_last: 'Son net',
                exam_input_help: 'Boş sayısı doğru ve yanlış girdikçe otomatik tamamlanır; elle de değiştirebilirsin. Her derste toplam, soru sayısına eşit olmalı.',
                exam_note_label: 'Not / yanlış analizi (isteğe bağlı)', exam_note_hint: 'Tekrar bakacağın konular, dikkat hataları...',
                exam_empty_chart: 'İlk denemeni eklediğinde grafiğin burada oluşacak.', exam_empty_list: 'Bu bölümde henüz kayıtlı deneme yok.', exam_chart_order: 'Denemeler tarih sırasıyla gösterilir.',
                exam_bad_title: 'Deneme adını yazmalısın (en fazla 140 karakter).', exam_bad_date: 'Geçerli bir deneme tarihi seçmelisin.', exam_bad_scores: 'İşaretli derslerin doğru, yanlış ve boş sayılarını kontrol et.',
                exam_row_error: 'Negatif olmayan tam sayılar gir; toplam {n} olmalı.', exam_save_error: 'Deneme kaydedilemedi. Bilgilerin bu pencerede duruyor; depolamayı kontrol edip tekrar deneyebilirsin.',
                exam_delete: '“{name}” adlı deneme kaydı silinsin mi?', exam_bad_notes: 'Not en fazla 3000 karakter olabilir.', exam_missing: 'Bu deneme artık mevcut değil.',
                exam_group_turkish: 'Türkçe', exam_group_social: 'Sosyal Bilimler', exam_group_math: 'Matematik', exam_group_science: 'Fen Bilimleri', exam_group_literature: 'Türk Dili ve Edebiyatı · Sosyal Bilimler 1', exam_group_social2: 'Sosyal Bilimler 2',
                exam_turkish: 'Türkçe', exam_history: 'Tarih', exam_geography: 'Coğrafya', exam_philosophy: 'Felsefe', exam_religion: 'Din / Ek Felsefe', exam_math: 'Matematik', exam_physics: 'Fizik', exam_chemistry: 'Kimya', exam_biology: 'Biyoloji',
                exam_literature: 'Türk Dili ve Edebiyatı', exam_history1: 'Tarih 1', exam_geography1: 'Coğrafya 1', exam_history2: 'Tarih 2', exam_geography2: 'Coğrafya 2', exam_philosophy_group: 'Felsefe Grubu', exam_religion2: 'Din / Ek Felsefe Grubu'
            },
            en: {
                exam_title: 'Practice Exams', exam_subtitle: 'Subject results and net-score progress.', exam_new: '+ New Exam', exam_new_title: 'New Exam', exam_edit_title: 'Edit Exam',
                exam_track: 'Track', exam_say: 'Science', exam_ea: 'Equal Weight', exam_soz: 'Verbal', exam_all: 'All tests', exam_trend: 'Net-score progress', exam_subject: 'Subject', exam_records: 'Exam records',
                exam_name: 'Exam name / publisher', exam_name_hint: 'e.g. TYT Practice Exam 1', exam_date: 'Exam date', exam_type: 'Exam type', exam_results: 'Subject results', exam_formula: 'Net = Correct − Wrong / 4',
                exam_correct: 'Correct', exam_wrong: 'Wrong', exam_blank: 'Blank', exam_total: 'Total net', exam_questions: 'questions', exam_count: 'exams', exam_last: 'Latest net',
                exam_input_help: 'Blank answers update automatically when you enter correct and wrong answers. You may also edit them. Each row must add up to the question count.',
                exam_note_label: 'Note / error analysis (optional)', exam_note_hint: 'Topics to review, careless mistakes...', exam_empty_chart: 'Add your first exam to start this chart.', exam_empty_list: 'No exams saved in this section yet.', exam_chart_order: 'Exams are shown in date order.',
                exam_bad_title: 'Enter an exam name (up to 140 characters).', exam_bad_date: 'Choose a valid exam date.', exam_bad_scores: 'Check the correct, wrong and blank counts in the marked rows.', exam_row_error: 'Use non-negative whole numbers totaling {n}.',
                exam_save_error: 'The exam could not be saved. Your entries remain here; check storage and try again.', exam_delete: 'Delete the exam “{name}”?', exam_bad_notes: 'The note can contain up to 3000 characters.', exam_missing: 'This exam no longer exists.',
                exam_group_turkish: 'Turkish', exam_group_social: 'Social Sciences', exam_group_math: 'Mathematics', exam_group_science: 'Science', exam_group_literature: 'Literature · Social Sciences 1', exam_group_social2: 'Social Sciences 2',
                exam_turkish: 'Turkish', exam_history: 'History', exam_geography: 'Geography', exam_philosophy: 'Philosophy', exam_religion: 'Religion / Extra Philosophy', exam_math: 'Mathematics', exam_physics: 'Physics', exam_chemistry: 'Chemistry', exam_biology: 'Biology', exam_literature: 'Turkish Literature',
                exam_history1: 'History 1', exam_geography1: 'Geography 1', exam_history2: 'History 2', exam_geography2: 'Geography 2', exam_philosophy_group: 'Philosophy Group', exam_religion2: 'Religion / Extra Philosophy Group'
            },
            de: {
                exam_title: 'Probeprüfungen', exam_subtitle: 'Fachergebnisse und Entwicklung der Nettopunkte.', exam_new: '+ Neue Prüfung', exam_new_title: 'Neue Prüfung', exam_edit_title: 'Prüfung bearbeiten',
                exam_track: 'Bereich', exam_say: 'Naturwissenschaften', exam_ea: 'Gleichgewichtet', exam_soz: 'Sprachlich', exam_all: 'Alle Tests', exam_trend: 'Entwicklung der Nettopunkte', exam_subject: 'Fach', exam_records: 'Prüfungsaufzeichnungen',
                exam_name: 'Prüfungsname / Verlag', exam_name_hint: 'z. B. TYT Probeprüfung 1', exam_date: 'Prüfungsdatum', exam_type: 'Prüfungstyp', exam_results: 'Fachergebnisse', exam_formula: 'Netto = Richtig − Falsch / 4',
                exam_correct: 'Richtig', exam_wrong: 'Falsch', exam_blank: 'Leer', exam_total: 'Netto gesamt', exam_questions: 'Fragen', exam_count: 'Prüfungen', exam_last: 'Letzter Nettowert',
                exam_input_help: 'Leere Antworten werden bei der Eingabe richtiger und falscher Antworten automatisch ergänzt. Sie sind auch bearbeitbar. Jede Zeile muss die Fragenanzahl ergeben.',
                exam_note_label: 'Notiz / Fehleranalyse (optional)', exam_note_hint: 'Themen zum Wiederholen, Flüchtigkeitsfehler...', exam_empty_chart: 'Nach der ersten Prüfung erscheint hier das Diagramm.', exam_empty_list: 'In diesem Bereich gibt es noch keine Prüfungen.', exam_chart_order: 'Prüfungen werden nach Datum angezeigt.',
                exam_bad_title: 'Einen Prüfungsnamen eingeben (maximal 140 Zeichen).', exam_bad_date: 'Ein gültiges Prüfungsdatum wählen.', exam_bad_scores: 'Die markierten Antwortzahlen prüfen.', exam_row_error: 'Nichtnegative ganze Zahlen eingeben; Summe: {n}.',
                exam_save_error: 'Speichern fehlgeschlagen. Die Eingaben bleiben erhalten; Speicher prüfen und erneut versuchen.', exam_delete: 'Prüfung „{name}“ löschen?', exam_bad_notes: 'Die Notiz darf maximal 3000 Zeichen enthalten.', exam_missing: 'Diese Prüfung ist nicht mehr vorhanden.',
                exam_group_turkish: 'Türkisch', exam_group_social: 'Sozialwissenschaften', exam_group_math: 'Mathematik', exam_group_science: 'Naturwissenschaften', exam_group_literature: 'Literatur · Sozialwissenschaften 1', exam_group_social2: 'Sozialwissenschaften 2',
                exam_turkish: 'Türkisch', exam_history: 'Geschichte', exam_geography: 'Geografie', exam_philosophy: 'Philosophie', exam_religion: 'Religion / Zusatzphilosophie', exam_math: 'Mathematik', exam_physics: 'Physik', exam_chemistry: 'Chemie', exam_biology: 'Biologie', exam_literature: 'Türkische Literatur',
                exam_history1: 'Geschichte 1', exam_geography1: 'Geografie 1', exam_history2: 'Geschichte 2', exam_geography2: 'Geografie 2', exam_philosophy_group: 'Philosophiegruppe', exam_religion2: 'Religion / Zusatzphilosophiegruppe'
            }
        };
        Object.keys(examTranslations).forEach(lang => Object.assign(dict[lang], examTranslations[lang]));
        let currentLang = appStorage.getItem('procats_lang') || 'tr';
        if (!Object.hasOwn(dict, currentLang)) currentLang = 'tr';
        function t(key) { return dict[currentLang]?.[key] ?? dict.tr[key] ?? key; }

        function setLang(lang) {
            if (!Object.hasOwn(dict, lang)) return;
            currentLang = lang; appStorage.setItem('procats_lang', lang);
            document.documentElement.lang = lang;
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = t(key);
                else el.textContent = t(key);
            });
            document.getElementById('swStartBtn').textContent = t(swRunning ? 'btn_pause' : 'btn_start');
            loadRandomQuote(); renderApp(); renderObsidian(); renderHeatmap();  renderExams();
            document.getElementById('themeMenu').style.display = 'none';
        }
                // --- STOIC & PHILOSOPHICAL QUOTES
        const allQuotes = [
            "Zorluklar zihni eğitir, bedeni değil. | Difficulties strengthen the mind, as labor does the body. | Seneca",
            "Kontrol edebileceklerine odaklan, edemediklerini bırak. | Focus on what you can control, let go of what you can't. | Epiktetos",
            "Hayatımız, düşüncelerimizin eseridir. | Our life is what our thoughts make it. | Marcus Aurelius",
            "Sadece bugünü yaşa. | Confine yourself to the present. | Marcus Aurelius",
            "Öfke geçici bir çılgınlıktır. | Anger is a momentary madness. | Seneca",
            "İnsanları olaylar değil, olaylar hakkındaki görüşleri rahatsız eder. | Men are disturbed not by things, but by the views which they take of things. | Epiktetos",
            "Sana yanlış yapanlardan intikam almanın en iyi yolu, onlar gibi olmamaktır. | The best revenge is not to be like your enemy. | Marcus Aurelius",
            "Değişim içeriden başlar. | Change begins from within. | Epiktetos",
            "Hiçbir rüzgar, hangi limana gittiğini bilmeyen bir gemiye yardımcı olamaz. | If one does not know to which port one is sailing, no wind is favorable. | Seneca",
            "Zorluklar, insanın kim olduğunu gösterir. | Difficulties show what men are. | Epiktetos",
            "Bir gün öleceğimizi her gün hatırlamalıyız. | Remember that you must die. | Marcus Aurelius",
            "Huzuru dış dünyada değil, kendi içimizde aramalıyız. | True happiness is to enjoy the present, without anxious dependence upon the future. | Seneca",
            "Korkularımız, hayatımızdaki gerçek tehlikelerden çok daha fazladır. | We suffer more often in imagination than in reality. | Seneca",
            "Zamanımız az değil, çoğunu boşa harcıyoruz. | It is not that we have a short time to live, but that we waste a lot of it. | Seneca",
            "Açgözlülük, her zaman yoksulluk çeker. | Greed is poverty in abundance. | Seneca",
            "Önce ne olmak istediğini kendine söyle, sonra gereğini yap. | First say to yourself what you would be; and then do what you have to do. | Epiktetos",
            "Önemli olan ne yaşadığın değil, ona nasıl göğüs gerdiğindir. | It's not what happens to you, but how you react to it that matters. | Epiktetos",
            "Sabır her şeydir. | Patience is all. | Zeno",
            "Şans, hazırlıklı zihni sever. | Fortune favors the prepared mind. | Seneca",
            "Hayat uzun değil, onu iyi kullanırsan yeterince uzundur. | Life is long if you know how to use it. | Seneca",
            "Kendi zihnini kontrol etme gücüne sahipsin, dış olaylar üzerinde değil. | You have power over your mind - not outside events. Realize this, and you will find strength. | Marcus Aurelius",
            "Gerçek zenginlik, az şeye ihtiyaç duymaktır. | True wealth is to have little and want less. | Epiktetos",
            "Öfkeni yenemiyorsan, öfke seni yener. | Anger, if not restrained, is frequently more hurtful to us than the injury that provokes it. | Seneca",
            "Bugün sahip olduğun şeylerin değerini bil, yarın geç olabilir. | Accept the things to which fate binds you, and love the people with whom fate brings you together. | Marcus Aurelius",
            "Yalnızlık, zihnin arınma yeridir. | Solitude is a place of purification. | Seneca",
            "Değiştiremeyeceğin şeyleri kabul etme cesaretine ve huzuruna sahip ol. | Grant me the serenity to accept the things I cannot change, courage to change the things I can, and wisdom to know the difference. | Epiktetos",
            "Sahip oldukların için şükret, sahip olamadıkların için üzülme. | He is a wise man who does not grieve for the things which he has not, but rejoices for those which he has. | Epiktetos",
            "Hayatın değeri uzunluğunda değil, kalitesindedir. | As is a tale, so is life: not how long it is, but how good it is, is what matters. | Seneca",
            "İyi bir insanın nasıl olması gerektiği üzerine tartışmayı bırak, bir tane ol. | Waste no more time arguing what a good man should be. Be one. | Marcus Aurelius",
            "Hiç kimse senin iznin olmadan seni aşağılayamaz. | You are as unhappy as you have convinced yourself you are. | Seneca",
            "Seni rahatsız eden dış olaylar değil, onlara yüklediğin anlamdır. | If you are pained by any external thing, it is not this thing that disturbs you, but your own judgment about it. | Marcus Aurelius",
            "Ölümden korkan biri, canlı bir insana yaraşır hiçbir şey yapamaz. | He who fears death will never do anything worthy of a man who is alive. | Seneca",
            "Her gün küçük bir hayattır. | Each day is a little life. | Seneca",
            "Felsefeni insanlara anlatma, onu yaşayarak göster. | Don't explain your philosophy. Embody it. | Epiktetos",
            "Güçlü insan, kendi zihnini yönetebilen insandır. | A man is as wretched as he has convinced himself he is. | Seneca",
            "Kötülüğe karşı en iyi savunma, düşmanına benzememektir. | The best way to avenge yourself is to not be like the enemy. | Marcus Aurelius",
            "Hayat kısa, sanat sonsuzdur. | Life is short, art long. | Seneca",
            "İçinde her zaman sığınabileceğin sakin bir sığınak vardır. | Within you is a stillness and a sanctuary to which you can retreat at any time. | Marcus Aurelius",
            "Hatalarımı gösterene minnettar olurum, çünkü kimse gerçeğe zarar vererek zarar görmemiştir. | If anyone can refute me—show me I'm making a mistake—I'll gladly change. | Marcus Aurelius",
            "Cehalet, tüm kötülüklerin köküdür. | Ignorance is the root and stem of all evil. | Epiktetos",
            "Karakter kaderdir. | Character is higher than intellect. | Marcus Aurelius",
            "Gelecek kaygısıyla bugünü mahvetme. | Never let the future disturb you. You will meet it with the same weapons of reason. | Marcus Aurelius",
            "Huzur, zihnin doğru düzenlenmesinden başka bir şey değildir. | Tranquility is nothing else than the good ordering of the mind. | Marcus Aurelius",
            "Önüne çıkan engeller, o an yapılan işin ta kendisidir; engel yolun kendisi olur. | The impediment to action advances action. What stands in the way becomes the way. | Marcus Aurelius",
            "Zaman bir nehir, olayların şiddetli bir akışıdır. | Time is a river, a violent current of events. | Marcus Aurelius",
            "Ruhun, düşüncelerinin rengine boyanır. | The soul becomes dyed with the color of thoughts. | Marcus Aurelius",
            "Sen bu hayatta sadece bir oyuncusun, rolünü en iyi şekilde oyna. | Remember that you are an actor in a play, which is as the author chooses it to be. | Epiktetos",
            "Sabah uyandığında nefes alabildiğin, düşünebildiğin için ne büyük bir ayrıcalık olduğunu düşün. | When you arise in the morning think of what a privilege it is to be alive, to think, to enjoy, to love. | Marcus Aurelius",
            "Hiç kimse kendi iradesi dışında köleleştirilemez. | No man is free who is not master of himself. | Epiktetos",
            "En iyi intikam, devasa bir başarıdır. | The best revenge is massive success. | Frank Sinatra",
            "Acı çekmek kaçınılmazdır, acı çekmeyi seçmek ise sana kalmıştır. | Pain is inevitable, suffering is optional. | Haruki Murakami",
            "Amacı olmayan bir zihin kendini kaybeder. | A mind without purpose will wander in dark places. | Anonim",
            "Demir ateşte dövülür, insan zorlukla. | Iron is forged in fire, man in hardship. | Anonim",
            "İnandığın yolda yalnız yürüsen de haklısın. | You are right even if you walk alone on the path you believe in. | Anonim",
            "Kartallar yalnız uçar, kargalar sürüyle. | Eagles fly alone, crows fly in flocks. | Anonim",
            "Rahatlık, başarının en büyük düşmanıdır. | Comfort is the enemy of achievement. | P.T. Barnum",
            "Gideceğin yeri bilmiyorsan, vardığın yerin önemi yoktur. | If you don't know where you are going, any road will get you there. | Lewis Carroll",
            "Karanlıkta bile bir adım atabilirsin. | Even in darkness, you can take a step forward. | Anonim",
            "Kaybettiğinde değil, vazgeçtiğinde yenilirsin. | You don't lose when you fall, you lose when you give up. | Anonim",
            "En karanlık an, şafağa en yakın olan andır. | The darkest hour is just before the dawn. | Thomas Fuller",
            "Korku sadece zihnindedir. | Fear is only in your mind. | Anonim",
            "Acı, zayıflığın vücudu terk etmesidir. | Pain is weakness leaving the body. | Chesty Puller",
            "Hiçbir mazeret, başarının yerini tutamaz. | Excuses will always be there for you, opportunity won't. | Anonim",
            "Düşüncelerini yönetemezsen, onlar seni yönetir. | If you don't manage your thoughts, they will manage you. | Anonim",
            "Başarmak için önce inanmak gerekir. | To succeed, we must first believe that we can. | Nikos Kazantzakis",
            "Yarını bekleme, yarına kimsenin senedi yok. | Do not boast about tomorrow, for you do not know what a day may bring. | Anonim",
            "Kendi ışığına güvenen, başkasının parlamasından rahatsız olmaz. | Those who trust their own light are not bothered by the shining of others. | Victor Hugo",
            "Fırtınanın gücü, ağacın köklerini derinleştirir. | The strength of the storm makes the roots of the tree go deeper. | Anonim",
            "Ter, başarının gözyaşlarıdır. | Sweat is the tears of success. | Anonim",
            "Mazeret üreten, çözüm üretemez. | He that is good for making excuses is seldom good for anything else. | Benjamin Franklin",
            "Acıya katlan, o seni özgürleştirecek. | Endure the pain, it will set you free. | Anonim",
            "Her kışın kalbinde titreyen bir ilkbahar vardır. | In the heart of every winter, a trembling spring lives. | Khalil Gibran",
            "Yetenek sadece bir başlangıçtır, disiplin onu efsane yapar. | Talent is just a starting point, discipline makes it legendary. | Anonim",
            "Büyük adamların hepsi yalnızdır. | All great men are alone. | Arthur Schopenhauer",
            "Eğer uçamıyorsan koş, koşamıyorsan yürü, yürüyemiyorsan sürün ama asla durma. | If you can't fly then run, if you can't run then walk, if you can't walk then crawl, but whatever you do you have to keep moving forward. | Martin Luther King Jr.",
            "Ne kadar sert düştüğün değil, ne kadar hızlı ayağa kalktığın önemlidir. | It's not how hard you fall, it's how fast you get up. | Anonim",
            "Kader cesurlara güler. | Fortune favors the bold. | Virgil",
            "Ateşten geçen bir daha yanmaz. | He who has passed through the fire will not burn again. | Anonim",
            "Kendini yenen insan, dünyayı yener. | He who conquers himself conquers the world. | Laozi",
            "Fırsatlar kapıyı çalmaz, sen kapıyı kırarsın. | Opportunities don't knock, you build a door. | Milton Berle",
            "Zorluklar, yeteneklerin uyanması için lazımdır. | Difficulties are necessary to awaken talents. | Anonim",
            "Gözünü hedeften ayırdığında, sadece engelleri görürsün. | You only see obstacles when you take your eyes off the goal. | Henry Ford",
            "İmkansız sadece bir kelimedir. | Impossible is just a word. | Anonim",
            "Sakin denizlerden yetenekli denizci çıkmaz. | A smooth sea never made a skilled sailor. | Franklin D. Roosevelt",
            "En büyük zafer, düşmemek değil, her düştüğünde ayağa kalkmaktır. | The greatest glory in living lies not in never falling, but in rising every time we fall. | Nelson Mandela",
            "Kendine inanmayan, başkalarını inandıramaz. | He who does not believe in himself cannot convince others. | Anonim",
            "Karanlığı lanetleyeceğine bir mum yak. | It is better to light a candle than curse the darkness. | Eleanor Roosevelt",
            "Bahaneler, başarısızlığın yapı taşlarıdır. | Excuses are the foundation of failure. | Anonim",
            "Her şey göründüğünden daha zordur. | Everything is harder than it looks. | Murphy",
            "Zirve her zaman yalnızdır. | The top is always lonely. | Anonim",
            "Dün dündür, bugün ise yeni bir fırsat. | Yesterday is history, tomorrow is a mystery, today is a gift. | Bill Keane",
            "Yüzüstü yere serilsen bile, hala ileriye doğru bakıyorsun. | Even if you fall on your face, you're still moving forward. | Victor Kiam",
            "Eylem, tüm başarının temel anahtarıdır. | Action is the foundational key to all success. | Pablo Picasso",
            "Bugünün acısı, yarının gücüdür. | The pain you feel today will be the strength you feel tomorrow. | Anonim",
            "Çekiç ve örs arasında kalan, demir olmalıdır. | Between the hammer and the anvil, one must be iron. | Anonim",
            "Güneşi istiyorsan, fırtınaya katlanacaksın. | If you want the rainbow, you gotta put up with the rain. | Dolly Parton",
            "Her usta bir zamanlar acemiydi. | Every master was once a beginner. | Helen Hayes",
            "Sessiz çalış, başarın gürültü yapsın. | Work hard in silence, let your success be your noise. | Frank Ocean",
            "Yorulmak yok, sadece yenilenmek var. | There is no getting tired, only getting renewed. | Anonim",
            "Vazgeçmeyen birini asla yenemezsin. | You just can't beat the person who never gives up. | Babe Ruth"
        ];

        let selectedQuoteIndex = null;
        let dailyQuoteTimer;
        let dailyQuoteState;
        function loadRandomQuote() {
            const extra = window.ProcatsQuotes?.added || [];
            if (dailyQuoteState === undefined) { try { dailyQuoteState = JSON.parse(appStorage.getItem('procats_daily_quote_v1') || 'null'); } catch { dailyQuoteState = null; } }
            const nextQuote = ProcatsDailyQuote.next(dailyQuoteState, allQuotes.length + extra.length,new Date(),[...allQuotes.map(q=>q.split(' | ')[0].normalize('NFKC').toLocaleLowerCase('tr-TR').replace(/[^\p{L}\p{N}]+/gu,' ').trim()),...extra.map(q=>q.tr.normalize('NFKC').toLocaleLowerCase('tr-TR').replace(/[^\p{L}\p{N}]+/gu,' ').trim())]);
            if (nextQuote !== dailyQuoteState) { dailyQuoteState = nextQuote; appStorage.setItem('procats_daily_quote_v1', JSON.stringify(nextQuote)); }
            selectedQuoteIndex = dailyQuoteState.index;
            clearTimeout(dailyQuoteTimer);
            const midnight = new Date(); midnight.setHours(24, 0, 0, 30);
            dailyQuoteTimer = setTimeout(loadRandomQuote, midnight.getTime() - Date.now());
            let text, author;
            if(selectedQuoteIndex<0){text=({tr:'Bugünün küçük adımına odaklan.',en:'Focus on one small step today.',de:'Konzentriere dich heute auf einen kleinen Schritt.'})[currentLang];author='Procats';}
            else if (selectedQuoteIndex < allQuotes.length) {
                const original = allQuotes[selectedQuoteIndex].split(' | ');
                text = currentLang === 'tr' ? original[0] : currentLang === 'de' ? window.ProcatsQuotes.legacyDE[selectedQuoteIndex] : original[1];
                author = original[2];
                if (author === 'Anonim') author = {tr:'Anonim',en:'Anonymous',de:'Unbekannt'}[currentLang];
                if (author === 'Epiktetos') author = {tr:'Epiktetos',en:'Epictetus',de:'Epiktet'}[currentLang];
            } else {
                const quote = extra[selectedQuoteIndex - allQuotes.length];
                text = quote[currentLang];
                author = quote.authorByLanguage?.[currentLang] || quote.author || {tr:'Stoacı düşünce · Procats',en:'Stoic reflection · Procats',de:'Stoischer Gedanke · Procats'}[currentLang];
            }
            const container = document.getElementById('homeQuoteContainer');
            if (!container) return;
            container.replaceChildren();
            for (const [className, value] of [['quote-icon','🏛️'],['quote-text','“'+text+'”'],['quote-author','— '+author]]) {
                const element = document.createElement('div'); element.className = className; element.textContent = value; container.append(element);
            }
        }

        
        document.addEventListener('visibilitychange', () => { if (!document.hidden) loadRandomQuote(); });
        window.addEventListener('focus', loadRandomQuote);
        let customConfirmCallback = null; let customAlertCallback = null;
        const promptQueue = [];
        function displayPrompt(message, callback, confirmation) {
            if (document.getElementById('customPromptOverlay').classList.contains('active')) {
                promptQueue.push({message, callback, confirmation}); return;
            }
            customConfirmCallback = confirmation ? callback : null;
            customAlertCallback = confirmation ? null : callback;
            document.getElementById('customPromptMessage').textContent = message;
            document.getElementById('customPromptActions').innerHTML = confirmation
                ? `<button class="btn-cancel" data-action-click="closeCustomPrompt(false)">${t('btn_cancel')}</button><button class="btn-save" style="background:var(--accent-danger);" data-action-click="executeCustomConfirm()">${t('btn_confirm')}</button>`
                : `<button class="btn-save" style="width:100%;" data-action-click="closeCustomPrompt(true)">${t('btn_confirm')}</button>`;
            document.getElementById('customPromptOverlay').classList.add('active');
        }
        function showCustomAlert(message, callback = null) { displayPrompt(message, callback, false); }
        function showCustomConfirm(message, callback) { displayPrompt(message, callback, true); }
        function nextPrompt() {
            if (!document.getElementById('customPromptOverlay').classList.contains('active') && promptQueue.length) {
                const next = promptQueue.shift(); displayPrompt(next.message, next.callback, next.confirmation);
            }
        }
        function closeCustomPrompt(isAlertClose = false, drain = true) {
            document.getElementById('customPromptOverlay').classList.remove('active');
            const callback = customAlertCallback; customAlertCallback = null; customConfirmCallback = null;
            if (isAlertClose && callback) callback();
            if (drain) nextPrompt();
        }
        function executeCustomConfirm() {
            const callback = customConfirmCallback;
            closeCustomPrompt(false, false);
            try { if (callback) callback(); } finally { nextPrompt(); }
        }
                function loadTheme() { const savedTheme = appStorage.getItem('procats_theme') || 'default'; document.documentElement.setAttribute('data-theme', savedTheme); }
        function setTheme(theme) { document.documentElement.setAttribute('data-theme', theme); appStorage.setItem('procats_theme', theme); document.getElementById('themeMenu').style.display = 'none'; }
        function toggleThemeMenu(e) { e.stopPropagation(); const menu = document.getElementById('themeMenu'); menu.style.display = menu.style.display === 'block' ? 'none' : 'block'; }
        function switchView(viewId) {
            const view = document.getElementById('view-' + viewId); if (!view) return;
            document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v === view));
            document.querySelectorAll('.obsidian-nav .nav-item').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-action-click') === `switchView('${viewId}')`);
            });
            if (viewId === 'exams') renderExams();
            hideAllMenus();
        }
        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
            if (['folderModal', 'dayModal', 'taskModal', 'linkModal'].includes(modalId)) editingId = null;
            if (['obsFolderModal', 'obsNoteModal'].includes(modalId)) editingObsId = null;
            if (modalId === 'examModal') { examEditingId = null; examDraft = null; }
        }
        
        function hideAllMenus() { 
            const menus = ['sidebarEmptyMenu', 'folderContextMenu', 'dayContextMenu', 'taskContextMenu', 'themeMenu', 'bmContextMenu', 'obsSidebarEmptyMenu', 'obsFolderMenu', 'obsNoteMenu'];
            menus.forEach(m => { const el = document.getElementById(m); if(el) el.style.display = 'none'; });
        }
        document.addEventListener('click', hideAllMenus);
        function showContextMenu(id, e, offset = 0) {
            hideAllMenus();
            const menu = document.getElementById(id);
            menu.style.display = 'block'; menu.style.bottom = 'auto';
            const rect = menu.getBoundingClientRect();
            menu.style.left = `${Math.max(8, Math.min(e.clientX - offset, window.innerWidth - rect.width - 8))}px`;
            menu.style.top = `${Math.max(8, Math.min(e.clientY, window.innerHeight - rect.height - 8))}px`;
        }
        document.addEventListener('keydown', e => {
            if (e.key !== 'Escape') return;
            if (document.getElementById('customPromptOverlay').classList.contains('active')) { closeCustomPrompt(true); return; }
            const modal = document.querySelector('.modal-overlay.active'); if (modal) closeModal(modal.id);
            hideAllMenus();
        });
        window.addEventListener('resize', hideAllMenus);

        function updateLiveClock() {
            if(document.hidden)return;
            const now = new Date(); const h = String(now.getHours()).padStart(2, '0'); const m = String(now.getMinutes()).padStart(2, '0'); const s = String(now.getSeconds()).padStart(2, '0');
            const timeString = `${h}:${m}:${s}`;
            for(const [view,id]of [['view-home','liveClockHome'],['view-timers','liveClockTimers']])if(document.getElementById(view)?.classList.contains('active')){const clock=document.getElementById(id);if(clock&&clock.textContent!==timeString)clock.textContent=timeString;}
        }
        setInterval(updateLiveClock, 1000); updateLiveClock();

        let activityData = readStoredJSON('yks_v6_activity', {});
        
        // Daily totals are derived atomically from the task-ID ledger.
        function refreshActivity(){activityData=JSON.parse(appStorage.getItem('yks_v6_activity')||'{}');renderHeatmap();}
        
        function renderHeatmap() {
            const grid = document.getElementById('heatmapGrid'); if(!grid) return; grid.innerHTML = ''; const todayDate = new Date();
            for(let i = 0; i < 30; i++) {
                const d = new Date(todayDate); d.setDate(d.getDate() - i); const dateStr = localDate(d); const count = activityData[dateStr] || 0;
                
                let lvl = 0; 
                if(count >= 20) lvl = 5; 
                else if(count >= 18) lvl = 4; 
                else if(count >= 10) lvl = 3; 
                else if(count >= 4) lvl = 2; 
                else if(count >= 1) lvl = 1;
                
                const box = document.createElement('div'); 
                box.className = lvl > 0 ? `heat-box lvl-${lvl}` : 'heat-box';
                box.title = `${dateStr}: ${count} ${t('task_count')}`; 
                grid.appendChild(box);
            }

        }
        function resetHeatmap() { showCustomConfirm(t('reset_heatmap'), () => { const next=ProcatsActivity.reset(ProcatsSync.getData(),tasks);if(!commitAppSections({yks_v3_tasks:next.yks_v3_tasks,yks_v6_activity:next.yks_v6_activity,procats_activity_v1:next.procats_activity_v1}))return;tasks=next.yks_v3_tasks;renderApp();refreshActivity(); }); }

        // --- TIMERS AND STOPWATCH
        let swStartTime = 0, swSavedTime = 0, swInterval = null, swRunning = false, durationClockPending = false;
        const durationClock=()=>window.ProcatsDurationClock;
        const stopwatchElapsed=()=>durationClock()?.elapsed(swStartTime)??Math.max(0,Date.now()-swStartTime);
        const timerRemainingMs=()=>durationClock()?.remaining(tEndTime)??Math.max(0,tEndTime-Date.now());
        const stopwatchTime=()=>swSavedTime+(swRunning?stopwatchElapsed():0);
        function durationViewVisible(id){return !document.hidden&&!!document.getElementById(id)?.classList.contains('active');}
        let swLastDisplay=null,swLastText='',swParts=[];
        function swUpdateDisplay(ms) {
            const m = Math.floor(ms / 60000).toString().padStart(2, '0'); const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0'); const milli = Math.floor((ms % 1000) / 10).toString().padStart(2, '0'); 
            const display=document.getElementById('swDisplay'),text=`${m}:${s}.${milli}`;
            // innerText reads force layout. Keep the previous value in memory so
            // the centisecond display only replaces changed text, without layout reads.
            if(display&&(display!==swLastDisplay||text!==swLastText)){
                if(display!==swLastDisplay)swParts=Array.from(display.querySelectorAll?.('[data-sw-part]')||[]);
                if(swParts.length===3){const values=[m,s,milli];if(m.length!==swLastText.split(':')[0].length&&swParts[0].style)swParts[0].style.inlineSize=`calc(${m.length}ch + ${m.length*2}px)`;for(let i=0;i<3;i++)if(swParts[i].textContent!==values[i])swParts[i].textContent=values[i];}
                else display.textContent=text;
                swLastDisplay=display;swLastText=text;
            }
        }
        function swRefreshScheduler(){
            clearInterval(swInterval);swInterval=null;
            if(durationViewVisible('view-home')&&!durationClockPending)swUpdateDisplay(stopwatchTime());
            if(swRunning&&durationViewVisible('view-home')&&!durationClockPending)swInterval=setInterval(()=>{
                const elapsed=stopwatchElapsed();
                // Keep portable cloud timestamps current after a wall-clock jump.
                if(Math.abs((Date.now()-swStartTime)-elapsed)>2000)saveSwState();
                swUpdateDisplay(stopwatchTime());
            },50);
        }
        function saveSwState() {
            if(swRunning){swSavedTime=Math.floor(stopwatchTime());swStartTime=Date.now();durationClock()?.forget('stopwatch');durationClock()?.elapsed(swStartTime);}
            appStorage.setItem('procats_sw', JSON.stringify({isRunning:swRunning,startTime:swStartTime,savedTime:swSavedTime}));
        }
        function swToggle() {
            const btn = document.getElementById('swStartBtn');
            if (swRunning) {
                swSavedTime=Math.floor(stopwatchTime());swRunning=false;clearInterval(swInterval);swInterval=null;durationClock()?.forget('stopwatch');swUpdateDisplay(swSavedTime);
                btn.innerText = t('btn_start'); btn.style.background = "var(--accent-color)"; btn.style.color = "white"; 
            } else { 
                swStartTime=Date.now();swRunning=true;durationClock()?.forget('stopwatch');durationClock()?.elapsed(swStartTime);
                btn.innerText = t('btn_pause'); btn.style.background = "#38383a"; btn.style.color = "white"; 
            }
            saveSwState();swRefreshScheduler();
        }
        function swReset() { clearInterval(swInterval);swInterval=null;swRunning=false;swStartTime=0;swSavedTime=0;durationClock()?.forget('stopwatch');swUpdateDisplay(0);const btn=document.getElementById('swStartBtn');btn.innerText=t('btn_start');btn.style.background="var(--accent-success)";btn.style.color="#121214";saveSwState(); }

        let tTime = 0, tInterval = null, tEndTime = 0, tDuration = 0;
        window.ProcatsTimerState=()=>({remaining:tInterval!==null?Math.max(0,Math.ceil(timerRemainingMs()/1000)):tTime,running:tInterval!==null,endTime:tEndTime,duration:Math.max(tTime,tDuration)});
        function tUpdateDisplay() { 
            if(!durationViewVisible('view-timers'))return;
            const timerDisplay = document.getElementById('timerDisplay'); if(!timerDisplay) return; 
            const m = Math.floor(tTime / 60).toString().padStart(2, '0'); const s = (tTime % 60).toString().padStart(2, '0'); 
            const text=`${m}:${s}`;if(timerDisplay.innerText!==text)timerDisplay.innerText=text;window.ProcatsTimerViews?.render();
        }
        function saveTimerState() { appStorage.setItem('procats_timer', JSON.stringify({ isRunning: tInterval !== null, endTime: tEndTime, remainingTime: tTime, duration: tDuration })); }
        
        function fireParticles() {
            const container = document.createElement('div'); container.style.position = 'fixed'; container.style.top = '50%'; container.style.left = '50%'; container.style.pointerEvents = 'none'; container.style.zIndex = '9999'; document.body.appendChild(container);
            const pColors = ['#0a84ff', '#32d74b', '#ff453a', '#ff9f0a', '#bd93f9'];
            for (let i = 0; i < 40; i++) {
                const p = document.createElement('div'); const size = Math.random() * 8 + 4; p.style.width = size + 'px'; p.style.height = size + 'px'; p.style.background = pColors[Math.floor(Math.random() * pColors.length)]; p.style.position = 'absolute'; p.style.borderRadius = '50%';
                const angle = Math.random() * Math.PI * 2; const velocity = Math.random() * 150 + 50; const tx = Math.cos(angle) * velocity; const ty = Math.sin(angle) * velocity;
                p.style.transition = 'transform 1.5s ease-out, opacity 1.5s ease-out'; p.style.transform = `translate(0px, 0px)`; container.appendChild(p); requestAnimationFrame(() => { p.style.transform = `translate(${tx}px, ${ty}px)`; p.style.opacity = '0'; });
            }
            setTimeout(() => container.remove(), 1500);
        }
        
        function setTimer(minutes) {
            const seconds = Math.round(Number(minutes) * 60);
            if (!Number.isSafeInteger(seconds) || seconds <= 0 || !isTimestamp(Date.now() + seconds * 1000)) return;
            window.ProcatsTimerAlerts?.cancel();clearInterval(tInterval); tInterval = null; tEndTime = 0; tTime = seconds; tDuration = seconds;
            tUpdateDisplay(); document.getElementById('timerDisplay').classList.remove('shake'); saveTimerState();
        }
        function setCustomTimer() {
            const input = document.getElementById('customTimerInput');
            if (!input.value || !input.reportValidity()) return;
            setTimer(input.value); input.value = '';
        }
        function finishTimer() {
            const finishedAt=tEndTime;
            clearInterval(tInterval); tInterval=null; tTime=0; tEndTime=0;
            tUpdateDisplay(); document.getElementById('timerDisplay').classList.remove('shake');
            saveTimerState(); if(!window.ProcatsTimerViews?.isOLED())fireParticles(); window.ProcatsTimerAlerts?.finish(finishedAt);
        }
        function tickTimer() {
            if(tInterval===null||(window.ProcatsNative?.isNative&&(document.hidden||durationClockPending)))return;
            const remainingMs=timerRemainingMs();tTime=Math.max(0,Math.ceil(remainingMs/1000));
            if (tTime === 0) { finishTimer(); return; }
            if(Math.abs((tEndTime-Date.now())-remainingMs)>2000){tEndTime=Date.now()+Math.ceil(remainingMs);durationClock()?.forget('timer');durationClock()?.remaining(tEndTime);saveTimerState();window.ProcatsTimerAlerts?.schedule(tEndTime);}
            if(durationViewVisible('view-timers')){tUpdateDisplay();document.getElementById('timerDisplay').classList.toggle('shake',tTime<=3);}
        }
        function startTimer(isResume = false) {
            if(tInterval!==null||tTime<=0)return;
            tDuration=Math.max(tTime,tDuration);
            if(!isResume){tEndTime=Date.now()+tTime*1000;durationClock()?.forget('timer');durationClock()?.remaining(tEndTime);}
            window.ProcatsTimerAlerts?.schedule(tEndTime,!isResume);
            tInterval=setInterval(tickTimer,1000);saveTimerState();tickTimer();
        }
        function pauseTimer() {
            if (tInterval !== null) {
                tTime=Math.max(0,Math.ceil(timerRemainingMs()/1000));
                if (tTime === 0) { finishTimer(); return; }
            }
            window.ProcatsTimerAlerts?.cancel();clearInterval(tInterval); tInterval = null; tEndTime = 0; tUpdateDisplay();
            document.getElementById('timerDisplay').classList.remove('shake'); saveTimerState();
        }
        function resetTimer() {
            window.ProcatsTimerAlerts?.cancel();
            clearInterval(tInterval); tInterval = null; tTime = 0; tEndTime = 0; tDuration = 0; tUpdateDisplay();
            document.getElementById('timerDisplay').classList.remove('shake'); saveTimerState();
        }
        function refreshDurationDisplays(){if(durationClockPending)return;if(swRunning&&Math.abs((Date.now()-swStartTime)-stopwatchElapsed())>2000)saveSwState();swRefreshScheduler();if(tInterval!==null)tickTimer();else tUpdateDisplay();window.ProcatsTimerViews?.render();}
        document.addEventListener('visibilitychange',async()=>{
            if(window.ProcatsNative?.isNative)durationClockPending=true;
            swRefreshScheduler();
            if(!document.hidden){try{if(window.ProcatsNative?.isNative)await window.ProcatsTimerAlerts?.resume();}finally{durationClockPending=false;refreshDurationDisplays();}}
        });
        window.addEventListener?.('procats-clock-ready',()=>{durationClockPending=false;refreshDurationDisplays();});
        if(typeof MutationObserver==='function')for(const id of ['view-home','view-timers']){const view=document.getElementById(id);if(view)new MutationObserver(refreshDurationDisplays).observe(view,{attributes:true,attributeFilter:['class']});}
                // --- OBSIDIAN FREE PLAN SYSTEM
        let obsFolders = readStoredJSON('procats_obs_folders', []);
        let obsNotes = readStoredJSON('procats_obs_notes', []);
        let activeObsFolderId = null; let activeObsNoteId = null; let editingObsId = null;

        function renderObsidian() {
            saveObsData();
            const list = document.getElementById('obsList'); if(!list) return; list.innerHTML = ''; 
            obsFolders.forEach(folder => {
                const folderGroup = document.createElement('div'); folderGroup.className = `folder-group ${folder.expanded ? 'open' : ''}`;
                const header = document.createElement('div'); header.className = 'folder-header';
                header.addEventListener('click', (e) => { if(!e.target.classList.contains('three-dots')) { folder.expanded = !folder.expanded; renderObsidian(); saveObsData(); } });
                header.innerHTML = `<div class="folder-left"><span class="folder-arrow">▶</span> <span class="icon">📁</span> ${escapeHtml(folder.name)}</div><div class="three-dots" data-action-click="handleObsFolderMenu(event, ${folder.id})">⋮</div>`;
                folderGroup.appendChild(header);

                const content = document.createElement('div'); content.className = 'folder-content';
                const fNotes = obsNotes.filter(n => n.folderId === folder.id);
                fNotes.forEach(note => {
                    const item = document.createElement('div'); item.className = `subject-item ${activeObsNoteId === note.id ? 'active-day' : ''}`;
                    item.onclick = (e) => { if(!e.target.classList.contains('three-dots')) { activeObsNoteId = note.id; renderObsEditor(); renderObsidian(); } };
                    item.innerHTML = `<div class="subject-info"><span class="icon">📄</span><span>${escapeHtml(note.name)}</span></div><div class="three-dots" data-action-click="handleObsNoteMenu(event, ${note.id})">⋮</div>`;
                    content.appendChild(item);
                });
                folderGroup.appendChild(content); list.appendChild(folderGroup);
            });
            const rootNotes = obsNotes.filter(n => !n.folderId || !obsFolders.some(f => f.id === n.folderId));
            rootNotes.forEach(note => {
                const item = document.createElement('div'); item.className = `subject-item ${activeObsNoteId === note.id ? 'active-day' : ''}`;
                item.onclick = (e) => { if(!e.target.classList.contains('three-dots')) { activeObsNoteId = note.id; renderObsEditor(); renderObsidian(); } };
                item.innerHTML = `<div class="subject-info"><span class="icon">📄</span><span>${escapeHtml(note.name)}</span></div><div class="three-dots" data-action-click="handleObsNoteMenu(event, ${note.id})">⋮</div>`;
                list.appendChild(item);
            });
        }

        function saveObsData() {if(commitAppSections({procats_obs_folders:obsFolders,procats_obs_notes:obsNotes}))return true;const old=ProcatsSync.getData();obsFolders=old.procats_obs_folders||[];obsNotes=old.procats_obs_notes||[];return false;}
        const obsSidebarEl = document.getElementById('obsSidebar'); 
        if(obsSidebarEl) { obsSidebarEl.addEventListener('contextmenu', (e) => { e.preventDefault(); if(e.target === obsSidebarEl || e.target.classList.contains('subject-list')) { showContextMenu('obsSidebarEmptyMenu', e, 0); } }); }
        
        function handleObsFolderMenu(e, id) { e.stopPropagation(); activeObsFolderId = id; showContextMenu('obsFolderMenu', e, 0); }
        function handleObsNoteMenu(e, id) { e.stopPropagation(); activeObsNoteId = id; renderObsEditor(); renderObsidian(); showContextMenu('obsNoteMenu', e, 0); }

        function obsActionSidebar(action) { if(action === 'new_folder') { editingObsId = null; document.getElementById('mObsFolderTitle').value=''; openModal('obsFolderModal'); } }
        function saveObsFolder() { const name = document.getElementById('mObsFolderTitle').value.trim(); if(!name) return;const next=editingObsId?obsFolders.map(f=>f.id===editingObsId?{...f,name}:f):[...obsFolders,{id:createId(),name,expanded:true}];if(!commitAppSections({procats_obs_folders:next}))return;obsFolders=next;editingObsId=null;closeModal('obsFolderModal');renderObsidian(); }
        
        function obsActionFolder(action) { 
            if(action === 'new_note') { editingObsId = null; document.getElementById('mObsNoteTitle').value=''; openModal('obsNoteModal'); }
            else if(action === 'rename') { editingObsId = activeObsFolderId; document.getElementById('mObsFolderTitle').value = obsFolders.find(f=>f.id===activeObsFolderId).name; openModal('obsFolderModal', null, true); }
            else if(action === 'delete') { 
                showCustomConfirm(t('alert_del_folder'), () => { 
                    obsNotes = obsNotes.filter(n => n.folderId !== activeObsFolderId); 
                    obsFolders = obsFolders.filter(f => f.id !== activeObsFolderId);
                    activeObsFolderId = null; renderObsidian(); renderObsEditor(); 
                }); 
            }
        }
        function saveObsNote() { const name = document.getElementById('mObsNoteTitle').value.trim(); if(!name) return;const next=editingObsId?obsNotes.map(n=>n.id===editingObsId?{...n,name}:n):[...obsNotes,{id:createId(),name,folderId:activeObsFolderId,content:''}];if(!commitAppSections({procats_obs_notes:next}))return;obsNotes=next;editingObsId=null;closeModal('obsNoteModal');renderObsidian();renderObsEditor(); }
        function obsActionNote(action) {
            if(action === 'rename') { editingObsId = activeObsNoteId; document.getElementById('mObsNoteTitle').value = obsNotes.find(n=>n.id===activeObsNoteId).name; openModal('obsNoteModal', null, true); }
            else if(action === 'delete') { showCustomConfirm(t('alert_del_day'), () => { obsNotes = obsNotes.filter(n=>n.id!==activeObsNoteId); activeObsNoteId=null; renderObsEditor(); renderObsidian(); }); }
        }
        function renderObsEditor() {
            const header = document.getElementById('obsEditorHeader'); const area = document.getElementById('obsEditorArea'); const empty = document.getElementById('obsEmptyState');
            const note = obsNotes.find(n => n.id === activeObsNoteId);
            if(!note) { activeObsNoteId = null; header.textContent = ''; area.value = ''; header.style.display='none'; area.style.display='none'; empty.style.display='flex'; return; }
            header.innerText = note.name; area.value = note.content || ''; empty.style.display='none'; header.style.display='block'; area.style.display='block';
        }
        function showSyncLimit(){showCustomAlert(({tr:'Bu düzenleme eşitleme sınırını (850 KB) aşıyor. Önceki kayıt korundu. Metni kısaltıp yeniden kaydet.',en:'This edit exceeds the 850 KB sync limit. Your previous record is preserved. Shorten the text and save again.',de:'Diese Änderung überschreitet die Synchronisierungsgrenze von 850 KB. Der vorherige Eintrag bleibt erhalten. Kürze den Text und speichere erneut.'})[currentLang]||'850 KB');}
        function canSaveSection(key,value) {
            try { if(ProcatsSync.checkSections)ProcatsSync.checkSections({[key]:value});else window.ProcatsLimits?.checkReplacement(ProcatsSync.getData(),key,value);return true; }
            catch {showSyncLimit();return false;}
        }
        function commitAppSections(updates){if(dataImportPending||Object.keys(updates).some(key=>blockedStorageKeys.has(key)))return false;try{ProcatsSync.commitSections(updates);return true;}catch(error){if(error.message==='backup-size')showSyncLimit();else warnStorage();return false;}}
        function saveObsNoteContent() { if(!activeObsNoteId) return; const val = document.getElementById('obsEditorArea').value, next = obsNotes.map(n => n.id === activeObsNoteId ? {...n, content: val} : n); if(canSaveSection('procats_obs_notes',next)&&appStorage.setItem('procats_obs_notes',JSON.stringify(next)))obsNotes=next; }

        // --- POST-IT NOTES
        let notes = readStoredJSON('yks_v5_notes', []);
        const noteColors = ['#ff9a9e', '#fecfef', '#a1c9f1', '#b2fba5', '#ffdfba', '#fff192']; 
        let draggedNoteIndex = null;
        window.ProcatsRefreshQuickNotes=()=>{notes=ProcatsSync.getData().yks_v5_notes||[];};

        function renderNotes() { 
            if(!appStorage.setItem('yks_v5_notes', JSON.stringify(notes)))notes=ProcatsSync.getData().yks_v5_notes||[];
            const grid = document.getElementById('notesGrid'); if(!grid) return; grid.innerHTML = ''; 
            notes.forEach((note, index) => { 

                const div = document.createElement('div'); div.className = `post-it`; div.style.background = /^#[0-9a-f]{3,8}$/i.test(note.color || '') ? note.color : noteColors[0]; div.draggable = false;
                div.innerHTML = `<button class="post-it-delete" data-action-click="deleteNote(${note.id})">✕</button><div class="note-content" contenteditable="true" data-action-input="updateNote(${note.id}, this.innerText)" data-action-paste="pasteNoteText(event, ${note.id})" data-action-drop="pasteNoteText(event, ${note.id})">${escapeHtml(note.text)}</div><div class="note-colors">${noteColors.map(c => `<div class="color-dot" style="background:${c}" data-action-click="changeNoteColor(${note.id}, '${c}')"></div>`).join('')}</div>`; 
                grid.appendChild(div); 
            }); 
        }
        function pasteNoteText(event, id) {
            event.preventDefault(); event.stopPropagation();
            const area = event.currentTarget;
            const text = (event.clipboardData || event.dataTransfer)?.getData('text/plain') || '';
            const selection = window.getSelection();
            if (selection && selection.rangeCount && area.contains(selection.getRangeAt(0).commonAncestorContainer)) {
                const range = selection.getRangeAt(0); range.deleteContents();
                const node = document.createTextNode(text); range.insertNode(node); range.setStartAfter(node); range.collapse(true);
                selection.removeAllRanges(); selection.addRange(range);
            } else { area.appendChild(document.createTextNode(text)); }
            updateNote(id, area.innerText);
        }
        function addNote() { notes.unshift({ id: createId(), text: "", color: noteColors[Math.floor(Math.random() * noteColors.length)] }); renderNotes(); }
        function updateNote(id, text) { const next = notes.map(n => n.id === id ? {...n, text} : n); if(canSaveSection('yks_v5_notes',next)&&appStorage.setItem('yks_v5_notes', JSON.stringify(next)))notes=next; }
        function deleteNote(id) { notes = notes.filter(n => n.id !== id); renderNotes(); }
        function changeNoteColor(id, color) { notes = notes.map(n => n.id === id ? {...n, color: color} : n); renderNotes(); }

        // --- BOOKMARKS (DRAG & DROP)
        let bookmarks = readStoredJSON('yks_v7_bookmarks', []);
        let draggedBmIndex = null; let activeBmId = null;
        
        function renderBookmarks() {
            const grid = document.getElementById('bookmarksGrid'); if(!grid) return; grid.innerHTML = '';
            bookmarks.forEach((bm, index) => {
                const card = document.createElement('div'); card.className = 'bookmark-card'; card.draggable = true;
                card.addEventListener('dragstart', (e) => { if (e.target.closest('button, select, input, textarea, [contenteditable]')) { e.preventDefault(); return; } e.dataTransfer.setData('type', 'bookmark'); draggedBmIndex = index; setTimeout(() => card.classList.add('dragging'), 0); }); card.addEventListener('dragend', () => { draggedBmIndex = null; card.classList.remove('dragging'); }); card.addEventListener('dragover', (e) => e.preventDefault());
                card.addEventListener('drop', (e) => { e.preventDefault(); if(e.dataTransfer.getData('type') === 'bookmark' && draggedBmIndex !== null && draggedBmIndex !== index) { const item = bookmarks.splice(draggedBmIndex, 1)[0]; bookmarks.splice(index, 0, item); draggedBmIndex = null; appStorage.setItem('yks_v7_bookmarks', JSON.stringify(bookmarks)); renderBookmarks(); } });
                card.onclick = (e) => {
                    if (e.target.closest('.bm-options') || draggedBmIndex !== null) return;
                    const url = normalizeBookmarkUrl(bm.url);
                    if (!url) { showCustomAlert(t('invalid_url')); return; }
                    if(window.ProcatsNative?.isNative){window.ProcatsOpenResource(url).catch(()=>showCustomAlert(t('invalid_url')));return;}
                    try {
                        if (typeof require === 'function') {
                            const {shell} = require('electron');
                            Promise.resolve(shell.openExternal(url)).catch(() => showCustomAlert(t('invalid_url'))); return;
                        }
                    } catch { /* Fall back to the regular browser. */ }
                    window.open(url, '_blank', 'noopener,noreferrer');
                };
                card.innerHTML = `<div style="display:flex; align-items:center; gap:15px; pointer-events:none;"><div class="bm-icon">${escapeHtml(bm.title.charAt(0))}</div><div style="overflow:hidden;"><div class="bm-title">${escapeHtml(bm.title)}</div></div></div><button type="button" class="bm-options" data-action-click="handleBmMenu(event, ${bm.id})">⋮</button>`; 
                grid.appendChild(card);
            });
        }
        function handleBmMenu(e, id) { e.stopPropagation(); activeBmId = id; showContextMenu('bmContextMenu', e, 100); }
        function bmMenuAction(action) { 
            if(action === 'edit') { const bm = bookmarks.find(b => b.id === activeBmId); editingId = bm.id; document.getElementById('mLinkTitle').value = bm.title; document.getElementById('mLinkUrl').value = bm.url; openModal('linkModal', null, true); } 
            else if (action === 'delete') { showCustomConfirm(t('alert_del_bm'), () => { bookmarks = bookmarks.filter(b => b.id !== activeBmId); appStorage.setItem('yks_v7_bookmarks', JSON.stringify(bookmarks)); renderBookmarks(); }); }
        }
        
        function normalizeBookmarkUrl(value) {
            if (typeof value !== 'string') return null;
            let input = value.trim(); if (!input || /[\u0000-\u0020\u007f]/.test(input)) return null;
            if (!/^[a-z][a-z\d+.-]*:/i.test(input)) input = 'https://' + input;
            try {
                const url = new URL(input);
                if(url.protocol==='http:')url.protocol='https:';
                return url.protocol==='https:' && url.hostname && !url.username && !url.password ? url.href : null;
            } catch { return null; }
        }
        function saveLink() {
            const title=document.getElementById('mLinkTitle').value.trim().slice(0,180);
            const url=window.ProcatsResourcesCore?.canonical(document.getElementById('mLinkUrl').value)||normalizeBookmarkUrl(document.getElementById('mLinkUrl').value);
            if(!title){showCustomAlert(t('alert_title_req'));return;}
            if(!url){showCustomAlert(t('invalid_url'));return;}
            const canonical=window.ProcatsResourcesCore?.canonical||normalizeBookmarkUrl;
            if(bookmarks.some(b=>b.id!==editingId&&canonical(b.url)===url)){showCustomAlert(({tr:'Bu kaynak zaten kayıtlı.',en:'This resource is already saved.',de:'Diese Quelle ist bereits gespeichert.'})[currentLang]);return;}
            const next=editingId?bookmarks.map(b=>b.id===editingId?{...b,title,url,resource:canonical(b.url)===url?b.resource:undefined}:b):[...bookmarks,{id:createId(),title,url}];
            if(!canSaveSection('yks_v7_bookmarks',next)||!appStorage.setItem('yks_v7_bookmarks',JSON.stringify(next)))return;
            bookmarks=next;closeModal('linkModal');renderBookmarks();
        }
                // Retain legacy archive records only for data and backup compatibility.
        let archives = readStoredJSON('yks_v8_archives', []);
        // --- DATA VAULT
        
        const backupJSONKeys = [
            'procats_folders', 'yks_v3_days', 'yks_v3_tasks', 'yks_v5_notes', 'yks_v6_activity', 'procats_activity_v1',
            'yks_v7_bookmarks', 'yks_v8_archives', 'procats_obs_folders', 'procats_obs_notes',
            'procats_reminders', 'procats_sw', 'procats_timer', 'procats_exams_v1', 'procats_exam_selection_v1', 'procats_lists_v1', 'procats_knowledge_v1', 'procats_navigation_v1', 'procats-device-settings-v1'
        ];
        const backupTextKeys = ['procats_theme', 'procats_lang', 'yks_v3_sidebarWidth', 'procats_obs_sidebarWidth'];
        function createBackupData() {
            const snapshot = {
                procats_lists_v1: window.ProcatsListsStore.get(),
                procats_knowledge_v1: window.ProcatsKnowledgeStore.get(),
                procats_folders: folders, yks_v3_days: days, yks_v3_tasks: tasks, yks_v5_notes: notes,
                yks_v6_activity: activityData, procats_activity_v1: ProcatsSync.getData().procats_activity_v1, yks_v7_bookmarks: bookmarks, yks_v8_archives: archives,
                procats_obs_folders: obsFolders, procats_obs_notes: obsNotes, procats_reminders: reminders,
                procats_navigation_v1: window.ProcatsMobileNavigation?.get() || ProcatsNavigation.defaults, 'procats-device-settings-v1': ProcatsPreferences.get(),
                procats_exams_v1: examRecords, procats_exam_selection_v1: getSelectedExams(),
                procats_sw: {isRunning:swRunning,startTime:swRunning?Date.now():swStartTime,savedTime:Math.floor(stopwatchTime())},
                procats_timer: {isRunning:tInterval!==null,endTime:tInterval!==null?Date.now()+Math.ceil(timerRemainingMs()):tEndTime,remainingTime:tInterval!==null?Math.max(0,Math.ceil(timerRemainingMs()/1000)):tTime,duration:tDuration}
            };
            const data = {format: 'procats', version: 2, exportDate: new Date().toISOString()};
            backupJSONKeys.forEach(key => {
                data[key] = blockedStorageKeys.has(key) ? appStorage.getItem(key) : JSON.stringify(snapshot[key]);
            });
            backupTextKeys.forEach(key => { data[key] = appStorage.getItem(key); });
            return data;
        }
        async function exportData() {
            const password=await ProcatsBackupUI.password('create');if(password===null)return;
            try {const encrypted=await ProcatsBackupCrypto.encryptBackup(createBackupData(),password);await ProcatsFiles.save(new Blob([JSON.stringify(encrypted)],{type:'application/json'}),'Procats_Backup_'+localDate()+'.procats.json');}
            catch(error){showCustomAlert(error.message==='backup-size'?ProcatsBackupUI.text().size:t('alert_import_err'));}
        }
        function prepareBackupData(data) {
            if (!isRecord(data) || (data.format != null && data.format !== 'procats')) throw new Error('Invalid backup');
            if (data.version != null && (!Number.isInteger(data.version) || data.version < 1 || data.version > 2)) throw new Error('Unsupported backup');
            const updates = new Map(); const decoded = {};
            for (const key of [...backupJSONKeys, ...backupTextKeys]) {
                if (!Object.hasOwn(data, key) || data[key] === null) continue;
                const isJSON = backupJSONKeys.includes(key);
                const value = normalizeLegacyData(key, isJSON && typeof data[key] === 'string' ? JSON.parse(data[key]) : data[key]);
                if (value === null) continue;
                if (!validData(key, value)) throw new Error('Invalid backup record');
                decoded[key] = value; updates.set(key, isJSON ? JSON.stringify(value) : value);
            }
            if (!updates.size) throw new Error('Empty backup');
            const merged=ProcatsSync.getData();for(const [key,value]of updates){const decodedValue=backupJSONKeys.includes(key)?JSON.parse(value):value;if(key==='procats_knowledge_v1')ProcatsKnowledgeCore.check(decodedValue);else ProcatsLimits.checkStructure(decodedValue);if(ProcatsSync.keys.includes(key))merged[key]=decodedValue;}if(!updates.has('procats_activity_v1')&&(updates.has('yks_v3_tasks')||updates.has('yks_v6_activity')))delete merged.procats_activity_v1;const normalized=ProcatsActivity.snapshot(merged);if(ProcatsLimits.checkChange)ProcatsLimits.checkChange(ProcatsSync.getData(),normalized);else ProcatsLimits.checkSnapshot(normalized);
            const nextDays = decoded.yks_v3_days ?? days;
            const nextTasks = decoded.yks_v3_tasks ?? tasks;
            const nextFolders = decoded.procats_folders ?? folders;
            const nextObsFolders = decoded.procats_obs_folders ?? obsFolders;
            const nextObsNotes = decoded.procats_obs_notes ?? obsNotes;
            if (nextTasks.some(task => !nextDays.some(day => day.id === task.dayId))) throw new Error('Missing day');
            if (nextDays.some(day => day.folderId != null && !nextFolders.some(folder => folder.id === day.folderId))) throw new Error('Missing folder');
            if (nextObsNotes.some(note => note.folderId != null && !nextObsFolders.some(folder => folder.id === note.folderId))) throw new Error('Missing note folder');
            if (decoded.yks_v7_bookmarks?.some(bookmark => !normalizeBookmarkUrl(bookmark.url))) throw new Error('Invalid link');
            return updates;
        }
        async function restoreBackupData(updates) {
            if(dataImportPending)return false;
            dataImportPending=true;
            try {await ProcatsSync.importBackup(updates);}
            catch {dataImportPending=false;showCustomAlert(t('storage_error'));return false;}
            for(const key of updates.keys())blockedStorageKeys.delete(key);
            clearInterval(tInterval);clearInterval(swInterval);tInterval=null;swInterval=null;swRunning=false;
            return true;
        }
        async function importData(event) {
            const input=event.target,file=input.files?.[0];input.value='';if(!file)return;
            if(file.size>ProcatsLimits.fileBytes){showCustomAlert(ProcatsBackupUI.text().size);return;}
            try {
                let imported=JSON.parse(await file.text());const legacy=imported?.format!=='procats-encrypted';
                if(!legacy){const password=await ProcatsBackupUI.password('open');if(password===null)return;imported=await ProcatsBackupCrypto.decryptBackup(imported,password);}
                const updates=prepareBackupData(imported);
                showCustomConfirm(ProcatsBackupUI.preview(updates,legacy),async()=>{
                    try {const current=prepareBackupData(imported);if(await restoreBackupData(current))showCustomAlert(t('alert_import_suc'),()=>location.reload());}
                    catch(error){showCustomAlert(error.message==='backup-size'?ProcatsBackupUI.text().size:t('alert_import_err'));}
                });
            }catch(error){showCustomAlert(error.message==='backup-size'?ProcatsBackupUI.text().size:error.message==='backup-unlock'?ProcatsBackupUI.text().failed:t('alert_import_err'));}
        }
        let dataAddReading=false;
        function openDataAddPicker(){if(dataImportPending||dataAddReading){showCustomAlert(ProcatsDataAddUI.text().busy);return;}document.getElementById('addDataFileInput').click();}
        async function addDataFile(event){
            const input=event.target,file=input.files?.[0];input.value='';if(!file)return;
            if(dataImportPending||dataAddReading){showCustomAlert(ProcatsDataAddUI.text().busy);return;}
            if(file.size>ProcatsLimits.fileBytes){showCustomAlert(ProcatsDataAddUI.text().limit);return;}
            dataAddReading=true;
            try{
                let imported=JSON.parse(await file.text());
                if(imported?.format==='procats-encrypted'){const password=await ProcatsBackupUI.password('open');if(password===null)return;imported=await ProcatsBackupCrypto.decryptBackup(imported,password);}
                const preview=ProcatsSync.previewAddition(imported);
                if(!preview.totalAdded&&!preview.totalChanged){showCustomAlert(ProcatsDataAddUI.text().none);return;}
                showCustomConfirm(ProcatsDataAddUI.preview(preview),async()=>{
                    if(dataImportPending){showCustomAlert(ProcatsDataAddUI.text().busy);return;}
                    dataImportPending=true;let result;
                    try{result=await ProcatsSync.addData(imported,preview.signature);}
                    catch(error){showCustomAlert(ProcatsDataAddUI.error(error));return;}
                    finally{dataImportPending=false;}
                    const message=ProcatsDataAddUI.text()[result.plan.totalAdded||result.plan.totalChanged?'success':'none'];
                    document.getElementById('addDataResult').textContent=message;
                    try{
                        if(result.mainChanged)window.procatsApplyRemote(result.previous,ProcatsSync.getData());
                        window.ProcatsKnowledgeStore?.refresh();window.ProcatsListsStore?.refresh();
                    }catch{showCustomAlert(ProcatsDataAddUI.text().refresh);return;}
                    showCustomAlert(message);
                });
            }catch(error){showCustomAlert(error.message==='backup-unlock'?ProcatsBackupUI.text().failed:ProcatsDataAddUI.error(error));}
            finally{dataAddReading=false;}
        }
                // --- FOLDER & TASK DATABASE & DRAG DROP
        let folders = readStoredJSON('procats_folders', []); let days = readStoredJSON('yks_v3_days', [ { id: 1, name: "Plan", folderId: null, completed: false } ]); let tasks = readStoredJSON('yks_v3_tasks', []); let activeDayId = null; let activeFolderId = null; let editingId = null; let activeTaskId = null; let draggedTaskIndex = null;
        function renderApp() { if(!commitAppSections({procats_folders:folders,yks_v3_days:days,yks_v3_tasks:tasks})){const old=ProcatsSync.getData();folders=old.procats_folders||[];days=old.yks_v3_days||[];tasks=old.yks_v3_tasks||[];}renderDays();renderTasks();refreshActivity(); }
        
        function renderDays() {
            const list = document.getElementById('dayList'); if(!list) return; list.innerHTML = ''; 
            folders.forEach(folder => {
                const folderGroup = document.createElement('div'); folderGroup.className = `folder-group ${folder.expanded ? 'open' : ''}`; const header = document.createElement('div'); header.className = 'folder-header'; header.draggable = true;
                header.addEventListener('click', (e) => { if(!e.target.classList.contains('three-dots')) { toggleFolder(folder.id); } }); header.addEventListener('dragstart', (e) => { e.dataTransfer.setData('type', 'folder'); e.dataTransfer.setData('id', folder.id); e.stopPropagation(); }); header.addEventListener('dragover', e => { e.preventDefault(); header.classList.add('drag-over'); }); header.addEventListener('dragleave', () => header.classList.remove('drag-over'));
                
                header.addEventListener('drop', e => { 
                    e.preventDefault(); e.stopPropagation(); header.classList.remove('drag-over'); 
                    const type = e.dataTransfer.getData('type'); 
                    const dragId = Number(e.dataTransfer.getData('id')); 
                    if (type === 'day') { 
                        days = days.map(d => d.id === dragId ? {...d, folderId: folder.id} : d); 
                        folders = folders.map(f => f.id === folder.id ? {...f, expanded: true} : f); 
                        renderApp(); 
                    } else if (type === 'folder' && dragId !== folder.id) { 
                        const dragIdx = folders.findIndex(f => f.id === dragId); 
                        if (dragIdx > -1) {
                            const dropIdx = folders.findIndex(f => f.id === folder.id); 
                            const item = folders.splice(dragIdx, 1)[0]; 
                            folders.splice(dropIdx, 0, item); 
                            renderApp(); 
                        }
                    } 
                });
                header.innerHTML = `<div class="folder-left"><span class="folder-arrow">▶</span> <span class="icon">📁</span> ${escapeHtml(folder.name)}</div><div class="three-dots" data-action-click="handleFolderMenu(event, ${folder.id})">⋮</div>`; folderGroup.appendChild(header); const content = document.createElement('div'); content.className = 'folder-content'; const folderDays = days.filter(d => d.folderId === folder.id); folderDays.forEach(day => content.appendChild(createDayElement(day))); folderGroup.appendChild(content); list.appendChild(folderGroup);
            });
            const rootDays = days.filter(d => !d.folderId || !folders.some(f => f.id === d.folderId)); rootDays.forEach(day => list.appendChild(createDayElement(day))); list.ondragover = e => e.preventDefault();
            list.ondrop = e => { 
                if(e.target === list || e.target.classList.contains('sidebar') || e.target.classList.contains('subject-list')) { 
                    const type = e.dataTransfer.getData('type'); 
                    const dragId = Number(e.dataTransfer.getData('id')); 
                    if(type === 'day') { e.preventDefault(); days = days.map(d => d.id === dragId ? {...d, folderId: null} : d); renderApp(); } 
                } 
            };
        }
        function createDayElement(day) {
            const li = document.createElement('div'); li.className = `subject-item ${day.completed ? 'completed' : ''} ${activeDayId === day.id ? 'active-day' : ''}`; li.draggable = true;
            li.addEventListener('dragstart', (e) => { e.dataTransfer.setData('type', 'day'); e.dataTransfer.setData('id', day.id); e.stopPropagation(); }); li.addEventListener('dragover', e => { e.preventDefault(); li.classList.add('drag-over'); }); li.addEventListener('dragleave', () => li.classList.remove('drag-over')); 
            
            li.addEventListener('drop', e => { 
                e.preventDefault(); e.stopPropagation(); li.classList.remove('drag-over'); 
                const type = e.dataTransfer.getData('type'); 
                const dragId = Number(e.dataTransfer.getData('id')); 
                if (type === 'day' && dragId !== day.id) { 
                    const dragIdx = days.findIndex(d => d.id === dragId); 
                    if (dragIdx > -1) {
                        const dropIdx = days.findIndex(d => d.id === day.id); 
                        const item = days.splice(dragIdx, 1)[0]; 
                        item.folderId = day.folderId; 
                        days.splice(dropIdx, 0, item); 
                        renderApp(); 
                    }
                } 
            });
            li.onclick = (e) => { if(e.target.classList.contains('checkbox-custom') || e.target.classList.contains('three-dots')) return; activeDayId = day.id; renderApp(); };
            li.innerHTML = `<div class="subject-info"><div class="checkbox-custom" data-action-click="toggleDayCompleted(event, ${day.id})"></div><span>${escapeHtml(day.name)}</span></div><div class="three-dots" data-action-click="handleDayMenu(event, ${day.id})">⋮</div>`; return li;
        }

        function toggleFolder(id) { folders = folders.map(f => f.id === id ? {...f, expanded: !f.expanded} : f); renderApp(); } function toggleDayCompleted(e, id) { e.stopPropagation(); days = days.map(d => d.id === id ? {...d, completed: !d.completed} : d); renderApp(); }
        const sidebarEl = document.getElementById('sidebar'); 
        if(sidebarEl) { sidebarEl.addEventListener('contextmenu', (e) => { e.preventDefault(); if(e.target === sidebarEl || e.target.classList.contains('subject-list')) { showContextMenu('sidebarEmptyMenu', e, 0); } }); }
        function handleFolderMenu(e, id) { e.stopPropagation(); activeFolderId = id; showContextMenu('folderContextMenu', e, 0); }
        function handleDayMenu(e, id) { e.stopPropagation(); activeDayId = id; renderApp(); showContextMenu('dayContextMenu', e, 0); }
        
        // EN: TASK MENU ACTIONS
        function taskMenuAction(action) { 
            const task = tasks.find(t=>t.id===activeTaskId); if (!task) return; 
            if(action==='edit'){ editingId=task.id; document.getElementById('mTaskTitle').value=task.title; document.getElementById('mTaskDesc').value=task.desc; document.getElementById('taskModal').classList.add('active'); } 
            else if(action==='delete'){ showCustomConfirm(t('alert_del_task'), () => { tasks = tasks.filter(t=>t.id!==activeTaskId); renderApp(); }); } 
            else if(action==='toggle_link'){ tasks = tasks.map(t=> t.id === activeTaskId ? {...t, isLinkedToNext: !t.isLinkedToNext} : t); renderApp(); }
            else if(action==='toggle_exempt'){ toggleTaskExemption(activeTaskId); }
        }
        function handleTaskMenuClick(e, id) { e.stopPropagation(); activeTaskId = id; showContextMenu('taskContextMenu', e, 150); }

        function actionSidebar(action) { if(action === 'new_folder') { editingId = null; document.getElementById('mFolderTitle').value=''; document.getElementById('folderModal').classList.add('active'); } }
        function saveFolder() { const name = document.getElementById('mFolderTitle').value.trim();if(!name)return;const next=editingId?folders.map(f=>f.id===editingId?{...f,name}:f):[...folders,{id:createId(),name,expanded:true}];if(!commitAppSections({procats_folders:next}))return;folders=next;editingId=null;closeModal('folderModal');renderApp(); }
        
        function actionFolder(action) { 
            if(action === 'summary') { hideAllMenus(); window.ProcatsWeekly.open(activeFolderId); }
            else if(action === 'rename') { editingId = activeFolderId; document.getElementById('mFolderTitle').value = folders.find(f=>f.id===activeFolderId).name; document.getElementById('folderModal').classList.add('active'); } 
            else if(action === 'new_day') { openModal('dayModal', activeFolderId); } 
            else if(action === 'delete') { 
                showCustomConfirm(t('alert_del_folder'), () => { 
                    const daysToDelete = days.filter(d => d.folderId === activeFolderId).map(d => d.id);
                    tasks = tasks.filter(t => !daysToDelete.includes(t.dayId)); 
                    days = days.filter(d => d.folderId !== activeFolderId); 
                    folders = folders.filter(f => f.id !== activeFolderId); 
                    renderApp(); 
                }); 
            }
            else if(action === 'copy') { const folderToCopy = folders.find(f => f.id === activeFolderId); const newFolderId = createId(); folders.push({ id: newFolderId, name: `${folderToCopy.name} (Kopya)`, expanded: true }); const daysToCopy = days.filter(d => d.folderId === activeFolderId); daysToCopy.forEach(d => { const newDayId = createId(); days.push({ id: newDayId, name: d.name, folderId: newFolderId, completed: d.completed }); const tasksToCopy = tasks.filter(t => t.dayId === d.id); tasksToCopy.forEach(t => { tasks.push({...t, id: createId(), dayId: newDayId, activityDate: null, completedDate: null}); }); }); renderApp(); }
        }
        
        function actionDay(action) { const day = days.find(d=>d.id===activeDayId); if (!day) return; if(action === 'rename') { editingId = day.id; document.getElementById('mDayTitle').value=day.name; openModal('dayModal', day.folderId, true); } else if(action === 'delete') { showCustomConfirm(t('alert_del_day'), () => { days=days.filter(d=>d.id!==activeDayId); tasks=tasks.filter(t=>t.dayId!==activeDayId); renderApp(); }); } else if(action === 'copy') { const newId = createId(); days.push({id:newId, name:`${day.name} (Kopya)`, folderId:day.folderId, completed:day.completed}); tasks.filter(t=>t.dayId===activeDayId).forEach(t=>tasks.push({...t, id:createId(), dayId:newId, activityDate:null, completedDate:null})); renderApp(); } else if(action === 'move') { populateFolderSelect('mMoveFolderSelect', day.folderId); document.getElementById('moveDayModal').classList.add('active'); } }

        function openModal(modalId, forcedFolderId = null, isEditing = false) {
            if (!isEditing && ['dayModal', 'taskModal', 'linkModal', 'folderModal'].includes(modalId)) editingId = null;
            if (!isEditing && ['obsFolderModal', 'obsNoteModal'].includes(modalId)) editingObsId = null;
            if (!isEditing && modalId === 'linkModal') { document.getElementById('mLinkTitle').value = ''; document.getElementById('mLinkUrl').value = ''; }
            if (!isEditing && modalId === 'obsFolderModal') document.getElementById('mObsFolderTitle').value = '';
            if (!isEditing && modalId === 'obsNoteModal') document.getElementById('mObsNoteTitle').value = '';
            if (modalId === 'taskModal' && !days.some(day => day.id === activeDayId)) return;
            if(modalId === 'dayModal') { if(!editingId) { document.getElementById('mDayTitle').value = ''; } populateFolderSelect('mDayFolderSelect', forcedFolderId); }
            if(modalId === 'taskModal' && !editingId) { document.getElementById('mTaskTitle').value=''; document.getElementById('mTaskDesc').value=''; }

            document.getElementById(modalId).classList.add('active');
        }
        function populateFolderSelect(selectId, selectedId) { const sel = document.getElementById(selectId); sel.innerHTML = `<option value="">-- ${t('root_folder')} --</option>`; folders.forEach(f => { sel.innerHTML += `<option value="${f.id}" ${f.id===selectedId ? 'selected':''}>📁 ${escapeHtml(f.name)}</option>`; }); }
        function saveDay() { const name = document.getElementById('mDayTitle').value.trim();if(!name)return;const fId=document.getElementById('mDayFolderSelect').value,folderId=fId?Number(fId):null,next=editingId?days.map(d=>d.id===editingId?{...d,name,folderId}:d):[...days,{id:createId(),name,folderId,completed:false}];if(!commitAppSections({yks_v3_days:next}))return;days=next;editingId=null;closeModal('dayModal');renderApp(); }
        function executeMoveDay() { const fId = document.getElementById('mMoveFolderSelect').value; const folderId = fId ? Number(fId) : null; days = days.map(d=>d.id===activeDayId ? {...d, folderId} : d); closeModal('moveDayModal'); renderApp(); }
        
        // EN: INITIALIZE NEW TASK WITH EXEMPT PROPERTY
        function saveTask() { if(!days.some(day => day.id === activeDayId)) return; const title=document.getElementById('mTaskTitle').value.trim(); const desc=document.getElementById('mTaskDesc').value.trim(); if(!title) return; const next=editingId?tasks.map(t=>t.id===editingId?{...t,title,desc}:t):[...tasks,{id:createId(),dayId:activeDayId,title,desc:desc||"-",completed:false,missed:false,rating:0,isExempt:false}]; if(!canSaveSection('yks_v3_tasks',next)||!appStorage.setItem('yks_v3_tasks',JSON.stringify(next)))return; tasks=next;editingId=null; closeModal('taskModal'); renderApp(); }

        function updateTaskRating(id, value) {const next=tasks.map(t=>t.id===id?{...t,rating:parseInt(value)}:t);if(appStorage.setItem('yks_v3_tasks',JSON.stringify(next)))tasks=next;}

        function renderTasks() { 
            const grid = document.getElementById('tasksGrid'); const mainTitle = document.getElementById('activeMainTitle'); const subTitle = document.getElementById('activeSubTitle'); const btnAdd = document.getElementById('btnAddTask'); const progressSection = document.getElementById('progressSection');
            if(!grid) return; grid.innerHTML = ''; 
            if (!days.some(day => day.id === activeDayId)) { activeDayId = null; mainTitle.innerText = t('lib_title'); subTitle.innerText = t('lib_sub'); btnAdd.disabled = true; progressSection.style.display = 'none'; return; } 
            progressSection.style.display = 'block'; const currentDay = days.find(d => d.id === activeDayId); mainTitle.innerText = currentDay.name; subTitle.innerText = ""; btnAdd.disabled = false; 
            
            const dayTasks = tasks.filter(t => t.dayId === activeDayId); 
            if (dayTasks.length === 0) { grid.innerHTML = `<div style="text-align:center; color:#888; grid-column:1/-1; margin-top:40px;">${t('no_tasks')}</div>`; } 
            else { 
                dayTasks.forEach(task => { 
                    const card = document.createElement('div'); 
                    // EN: Check exemption for visual feedback
                    card.className = `task-card ${task.completed ? 'completed' : ''} ${task.missed ? 'missed' : ''} ${task.isExempt ? 'exempt' : ''}`; card.draggable = true; card.dataset.taskId = task.id;
                    card.addEventListener('dragstart', (e) => { if (e.target.closest('button, select, input, textarea, [contenteditable]')) { e.preventDefault(); return; } e.dataTransfer.setData('type', 'task'); draggedTaskIndex = dayTasks.findIndex(t => t.id === task.id); setTimeout(() => card.classList.add('dragging'), 0); });
                    card.addEventListener('dragend', () => { draggedTaskIndex = null; card.classList.remove('dragging'); }); card.addEventListener('dragover', (e) => e.preventDefault());
                    card.addEventListener('drop', (e) => { e.preventDefault(); const targetIndex = dayTasks.findIndex(t => t.id === task.id); if(e.dataTransfer.getData('type') === 'task' && draggedTaskIndex !== null && draggedTaskIndex !== targetIndex) { const next = ProcatsPlanning.reorder(tasks, activeDayId, dayTasks[draggedTaskIndex].id, task.id); draggedTaskIndex = null; if (canSaveSection('yks_v3_tasks', next) && appStorage.setItem('yks_v3_tasks', JSON.stringify(next))) { tasks = next; renderApp(); } } });
                    
                    let ratingOptions = '<option value="0">- / 10</option>';
                    for(let i=1; i<=10; i++) { ratingOptions += `<option value="${i}" ${task.rating === i ? 'selected':''}>${i} / 10</option>`; }

                    card.innerHTML = `
                        ${task.isLinkedToNext && task.id !== dayTasks[dayTasks.length - 1].id ? '<div class="block-link-icon"><svg viewBox="0 0 24 24"><path d="M17 7h-4v2h4c1.65 0 3 1.35 3 3s-1.35 3-3 3h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-6 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2zm-3-4h8v2H8z"/></svg></div>' : ''}
                        <div class="task-options" data-action-click="handleTaskMenuClick(event, ${task.id})">⋮</div>
                        <div>
                            <div class="task-header">
                                <div class="task-title">
                                    ${escapeHtml(task.title)}
                                    ${task.isExempt ? '<br><span class="exempt-badge">🔥 Heatmap Off</span>' : ''}
                                </div>
                                <select class="task-rating" data-action-change="updateTaskRating(${task.id}, this.value)" title="Verim Puanı">${ratingOptions}</select>
                            </div>
                            <div class="task-desc">${escapeHtml(task.desc).replace(/\n/g, '<br>')}</div>
                        </div>
                        <div class="task-footer">
                            <button class="btn-status btn-done" data-action-click="toggleTask(${task.id})">${task.completed ? t('status_done') : t('status_doing')}</button>
                            <button class="btn-status btn-missed" data-action-click="toggleMissed(${task.id})">${task.missed ? t('status_missed_act') : t('status_missed')}</button>
                        </div>
                    `; 
                    grid.appendChild(card); 
                }); 
            } 
            const comp = dayTasks.filter(t => t.completed).length; const pct = dayTasks.length === 0 ? 0 : Math.round((comp / dayTasks.length) * 100); 
            document.getElementById('progressBar').style.width = `${pct}%`; document.getElementById('progressPercentage').innerText = `${pct}%`; 
        }
        
        
        function toggleTask(id) {
            tasks = tasks.map(task => {
                if (task.id !== id) return task;
                if (task.completed) {
                    return {...task, completed: false, activityDate: null, completedDate: null};
                }
                const date = localDate();
                return {...task, completed: true, missed: false, completedDate: date, activityDate: task.isExempt ? null : date};
            });
            renderApp();
        }
        function toggleMissed(id) {
            tasks = tasks.map(task => {
                if (task.id !== id) return task;
                return {...task, missed: !task.missed, completed: false, activityDate: null, completedDate: null};
            });
            renderApp();
        }
        function toggleTaskExemption(id) {
            tasks = tasks.map(task => {
                if (task.id !== id) return task;
                const isExempt = !task.isExempt;
                let activityDate = task.activityDate || null;
                if (isExempt && activityDate) { activityDate = null; }
                else if (!isExempt && task.completed && task.completedDate && !activityDate) {
                    activityDate = task.completedDate;
                }
                return {...task, isExempt, activityDate};
            });
            renderApp();
        }
                const resizer = document.getElementById('resizer');
        let isResizing = false; const savedWidth = appStorage.getItem('yks_v3_sidebarWidth'); if (savedWidth && validData('yks_v3_sidebarWidth', savedWidth) && sidebarEl) sidebarEl.style.width = savedWidth;
        if(resizer) {
            resizer.addEventListener('mousedown', () => { isResizing = true; document.body.style.cursor = 'col-resize'; resizer.classList.add('active'); }); 
            document.addEventListener('mousemove', (e) => { if (!isResizing) return; let newWidth = e.clientX - sidebarEl.getBoundingClientRect().left; if (newWidth < 220) newWidth = 220; if (newWidth > 600) newWidth = 600; sidebarEl.style.width = `${newWidth}px`; }); 
            document.addEventListener('mouseup', () => { if (isResizing) { isResizing = false; document.body.style.cursor = 'default'; resizer.classList.remove('active'); appStorage.setItem('yks_v3_sidebarWidth', sidebarEl.style.width); } });
        }

        const obsResizer = document.getElementById('obsResizer');
        let isObsResizing = false; const savedObsWidth = appStorage.getItem('procats_obs_sidebarWidth'); if (savedObsWidth && validData('procats_obs_sidebarWidth', savedObsWidth) && obsSidebarEl) obsSidebarEl.style.width = savedObsWidth;
        if(obsResizer) {
            obsResizer.addEventListener('mousedown', () => { isObsResizing = true; document.body.style.cursor = 'col-resize'; obsResizer.classList.add('active'); }); 
            document.addEventListener('mousemove', (e) => { if (!isObsResizing) return; let newWidth = e.clientX - obsSidebarEl.getBoundingClientRect().left; if (newWidth < 220) newWidth = 220; if (newWidth > 600) newWidth = 600; obsSidebarEl.style.width = `${newWidth}px`; }); 
            document.addEventListener('mouseup', () => { if (isObsResizing) { isObsResizing = false; document.body.style.cursor = 'default'; obsResizer.classList.remove('active'); appStorage.setItem('procats_obs_sidebarWidth', obsSidebarEl.style.width); } });
        }

        // Retain legacy fields for backup compatibility without running any messaging code.
        let reminders = readStoredJSON('procats_reminders', []);
        // Removed messaging credentials are never read, exported or imported.
        if(appStorage.getItem('procats_bot_settings')!==null)appStorage.removeItem('procats_bot_settings');
        try{localStorage.removeItem('procats_bot_settings');}catch{}

        // Practice exam tracking. Legacy TYT/AYT record shapes remain compatible.
        // Reference: https://dokuman.osym.gov.tr/pdfdokuman/2026/YKS/sss_yksd19022026.pdf (Q40).
        const examSubjects = {
            tyt: [
                {id:'turkish', count:40, group:'turkish'},
                {id:'history', count:5, group:'social'}, {id:'geography', count:5, group:'social'},
                {id:'philosophy', count:5, group:'social'}, {id:'religion', count:5, group:'social'},
                {id:'math', count:40, group:'math'},
                {id:'physics', count:7, group:'science'}, {id:'chemistry', count:7, group:'science'}, {id:'biology', count:6, group:'science'}
            ],
            ayt: [
                {id:'literature', count:24, group:'literature'}, {id:'history1', count:10, group:'literature'}, {id:'geography1', count:6, group:'literature'},
                {id:'history2', count:11, group:'social2'}, {id:'geography2', count:11, group:'social2'},
                {id:'philosophy_group', count:12, group:'social2'}, {id:'religion2', count:6, group:'social2'},
                {id:'math', count:40, group:'math'},
                {id:'physics', count:14, group:'science'}, {id:'chemistry', count:13, group:'science'}, {id:'biology', count:13, group:'science'}
            ]
        };
        const examTracks = {say:['math','science'], ea:['literature','math'], soz:['literature','social2'], all:['literature','social2','math','science']};
        function getExamSubjects(type, track = 'say') {
            if (type === 'tyt') return examSubjects.tyt;
            if (type !== 'ayt') return ProcatsExamData.profile(type,track)?.subjects || [];
            if (!Object.hasOwn(examTracks, track)) return [];
            return examSubjects.ayt.filter(subject => examTracks[track].includes(subject.group));
        }
        function isExamDate(value) {
            if (!isDateKey(value) || value.slice(0, 4) === '0000') return false;
            const parsed = new Date(value + 'T12:00:00');
            return Number.isFinite(parsed.getTime()) && localDate(parsed) === value;
        }
        function validExamScore(score, questionCount) {
            return isRecord(score) && ['correct','wrong','blank'].every(key => Object.hasOwn(score,key) && isCount(score[key])) &&
                score.correct + score.wrong + score.blank === questionCount;
        }
        function validateExamRecords(records) {
            if (!Array.isArray(records)) return false;
            const ids = new Set();
            return records.every(record => {
                if (!isRecord(record) || !isId(record.id) || ids.has(record.id)) return false;
                ids.add(record.id);
                if (!ProcatsExamData.validTrack(record.type,record.track)) return false;
                if (typeof record.title !== 'string' || !record.title.trim() || record.title.length > 140 || !isExamDate(record.date)) return false;
                if (record.notes != null && (typeof record.notes !== 'string' || record.notes.length > 3000)) return false;
                if (record.createdAt != null && !isTimestamp(record.createdAt)) return false;
                if (record.updatedAt != null && !isTimestamp(record.updatedAt)) return false;
                const subjects = getExamSubjects(record.type, record.track);
                if (ProcatsExamData.profile(record.type,record.track).manual) return isRecord(record.scores) && Object.keys(record.scores).length === 0 && typeof record.result === 'number' && Number.isFinite(record.result) && record.result >= 0 && record.result <= 100;
                if (!isRecord(record.scores) || Object.keys(record.scores).length !== subjects.length) return false;
                return subjects.every(subject => Object.hasOwn(record.scores,subject.id) && validExamScore(record.scores[subject.id], subject.count));
            });
        }

        let examRecords = readStoredJSON('procats_exams_v1', []);
        let activeExamType = null, activeExamTrack = null, activeExamSubject = 'total';
        let examEditingId = null, examDraft = null;

        function formatExamNet(value) { return Number(value).toLocaleString(currentLang, {minimumFractionDigits:2, maximumFractionDigits:2}); }
        function formatExamDate(value, short = false) {
            return new Date(value + 'T12:00:00').toLocaleDateString(currentLang, short
                ? {day:'2-digit', month:'short'} : {day:'2-digit', month:'2-digit', year:'numeric'});
        }
        function getExamTotals(record, subjectId = 'total') {
            const totals = {correct:0, wrong:0, blank:0, questions:0, net:0};
            if (ProcatsExamData.profile(record.type,record.track)?.manual) return {...totals,net:record.result,questions:100};
            getExamSubjects(record.type, record.track).forEach(subject => {
                if (subjectId !== 'total' && subject.id !== subjectId) return;
                const score = record.scores[subject.id];
                totals.correct += score.correct; totals.wrong += score.wrong; totals.blank += score.blank; totals.questions += subject.count;
            });
            totals.net = ProcatsExamData.net(totals.correct,totals.wrong,record.type,record.track);
            return totals;
        }
        function getVisibleExams() {
            return examRecords.filter(record => record.type === activeExamType && (!ProcatsExamData.tracks(record.type).length || record.track === activeExamTrack))
                .sort((a,b) => a.date.localeCompare(b.date) || a.id - b.id);
        }
        function switchExamType(type) {
            if (!getSelectedExams().includes(type)) return;
            activeExamType = type; activeExamTrack = ProcatsExamData.defaultTrack(type); activeExamSubject = 'total'; renderExams();
        }
        function changeExamTrack(track) {
            if (!ProcatsExamData.validTrack(activeExamType,track)) return;
            activeExamTrack = track; activeExamSubject = 'total'; renderExams();
        }
        function changeExamChartSubject(subjectId) {
            if (subjectId !== 'total' && !getExamSubjects(activeExamType,activeExamTrack).some(subject => subject.id === subjectId)) return;
            activeExamSubject = subjectId; renderExamChart();
        }
        function examScopeLabel(type, track) { return (ProcatsExamData.catalog[type]?.label || '') + (ProcatsExamData.tracks(type).length ? ' · ' + (type === 'ayt' ? t('exam_' + track) : ProcatsExamData.profile(type,track).label) : ''); }
        function examSubjectLabel(subject) { return subject.label || t('exam_' + subject.id); }
        function examMetricLabel(type,track) { const profile=ProcatsExamData.profile(type,track); return profile?.manual ? examText('result') : profile?.divisor === 0 ? t('exam_correct') : t('exam_total'); }
        function examDraftKey() { return examDraft.type + ':' + (examDraft.track || ''); }
        function createExamElement(tag, className = '', text = null) {
            const element = document.createElement(tag); if (className) element.className = className;
            if (text !== null) element.textContent = text;
            return element;
        }

        function renderExams() {
            const list = document.getElementById('examRecordList'); if (!list) return;
            document.getElementById('examNav').title = t('exam_title');
            document.getElementById('examNav').setAttribute('aria-label',t('exam_title'));
            if (!renderExamSelection()) return;
            renderExamTrackSelect('examTrackFilter',activeExamType,activeExamTrack);
            document.getElementById('examTrackFilterWrap').hidden = !ProcatsExamData.tracks(activeExamType).length;
            const subjects = getExamSubjects(activeExamType, activeExamTrack);
            if (activeExamSubject !== 'total' && !subjects.some(subject => subject.id === activeExamSubject)) activeExamSubject = 'total';
            const select = document.getElementById('examChartSubject'); select.innerHTML = '';
            [{id:'total',label:examMetricLabel(activeExamType,activeExamTrack)},...subjects.map(subject => ({id:subject.id,label:examSubjectLabel(subject)}))].forEach(subject => {
                const option = document.createElement('option'); option.value = subject.id; option.textContent = subject.label; select.appendChild(option);
            });
            select.value = activeExamSubject;
            const records = getVisibleExams();
            document.getElementById('examListCount').textContent = `${records.length} ${t('exam_count')}`;
            list.innerHTML = '';
            if (!records.length) {
                const empty = createExamElement('div','exam-empty',t('exam_empty_list')); empty.style.gridColumn = '1 / -1'; list.appendChild(empty);
            } else {
                [...records].reverse().forEach(record => list.appendChild(createExamCard(record)));
            }
            renderExamChart();
            if (examDraft && document.getElementById('examModal').classList.contains('active')) {
                captureExamDraft(); renderExamFormRows();
                document.getElementById('examModalTitle').textContent = t(examEditingId ? 'exam_edit_title' : 'exam_new_title');
            }
        }

        function createExamCard(record) {
            const totals = getExamTotals(record);
            const card = createExamElement('article','exam-card');
            card.setAttribute('data-exam-id',record.id);
            const rows = getExamSubjects(record.type,record.track).map(subject => {
                const score = record.scores[subject.id];
                return `<tr><td>${escapeHtml(examSubjectLabel(subject))}</td><td>${score.correct}</td><td>${score.wrong}</td><td>${score.blank}</td><td class="exam-net">${formatExamNet(ProcatsExamData.net(score.correct,score.wrong,record.type,record.track))}</td></tr>`;
            }).join('');
            card.innerHTML = `
                <div class="exam-card-header">
                    <div><h4 class="exam-card-title">${escapeHtml(record.title)}</h4><div class="exam-card-meta"><time datetime="${record.date}">${escapeHtml(formatExamDate(record.date))}</time><span class="exam-type-badge">${escapeHtml(examScopeLabel(record.type,record.track))}</span></div></div>
                    <div class="exam-card-net"><strong>${formatExamNet(totals.net)}</strong><span>${examMetricLabel(record.type,record.track)} / ${totals.questions}</span></div>
                </div>
                <div class="exam-card-counts"><span><b class="exam-correct">${totals.correct}</b> ${t('exam_correct')}</span><span><b class="exam-wrong">${totals.wrong}</b> ${t('exam_wrong')}</span><span><b>${totals.blank}</b> ${t('exam_blank')}</span></div>
                <details class="exam-details"><summary>${t('exam_results')}</summary><div class="exam-table-scroll"><table class="exam-table"><thead><tr><th scope="col">${t('exam_subject')}</th><th scope="col">${t('exam_correct')}</th><th scope="col">${t('exam_wrong')}</th><th scope="col">${t('exam_blank')}</th><th scope="col">Net</th></tr></thead><tbody>${rows}</tbody></table></div>${record.notes ? `<div class="exam-note">${escapeHtml(record.notes)}</div>` : ''}</details>
                <div class="exam-card-actions"><button type="button" class="exam-edit-btn" data-action-click="openExamModal(${record.id})">${t('ctx_edit')}</button><button type="button" class="btn-delete-sm" data-action-click="deleteExam(${record.id})">${t('btn_delete')}</button></div>`;
            if (ProcatsExamData.profile(record.type,record.track)?.manual) { card.querySelector('.exam-card-counts').textContent=examText('manual_saved'); card.querySelector('.exam-table-scroll').remove(); }
            return card;
        }

        function buildExamChartSVG(records, subjectId = 'total') {
            if (!records.length) return '';
            const availableWidth = document.getElementById('examChart')?.clientWidth || 420;
            const compactWidth = Math.min(availableWidth,420);
            const growth = Math.min(1,Math.max(0,(records.length-2)/6));
            const width = Math.max(Math.round(compactWidth+(availableWidth-compactWidth)*growth), 85 + Math.max(1,records.length-1)*90), height = 260;
            const pad = {left:55,right:30,top:24,bottom:58};
            const plotWidth = width - pad.left - pad.right, plotHeight = height - pad.top - pad.bottom;
            const values = records.map(record => getExamTotals(record,subjectId).net);
            const min = Math.min(0, Math.floor(Math.min(...values) / 5) * 5);
            const max = Math.max(5, Math.ceil(Math.max(...values) / 5) * 5);
            const x = index => pad.left + (records.length === 1 ? plotWidth / 2 : index * plotWidth / (records.length - 1));
            const y = value => pad.top + (max - value) / (max - min) * plotHeight;
            const label = subjectId === 'total' ? examMetricLabel(activeExamType,activeExamTrack) : examSubjectLabel(getExamSubjects(activeExamType,activeExamTrack).find(s=>s.id===subjectId));
            let marks = '';
            for (let i=0; i<=4; i++) {
                const value = min + (max-min)*i/4, yy = y(value);
                marks += `<line class="exam-chart-grid" x1="${pad.left}" y1="${yy}" x2="${width-pad.right}" y2="${yy}"/><text x="${pad.left-12}" y="${yy+4}" text-anchor="end">${value.toLocaleString(currentLang,{maximumFractionDigits:2})}</text>`;
            }
            const coordinates = values.map((value,index) => `${x(index)},${y(value)}`).join(' ');
            let series = '';
            if (records.length > 1) series = `<polygon class="exam-chart-area" points="${x(0)},${y(0)} ${coordinates} ${x(records.length-1)},${y(0)}"/><polyline class="exam-chart-line" points="${coordinates}"/>`;
            const dots = records.map((record,index) => {
                const title = `${formatExamDate(record.date)} · ${record.title} · ${label}: ${formatExamNet(values[index])}`;
                return `<circle class="exam-chart-dot" cx="${x(index)}" cy="${y(values[index])}" r="4.5" tabindex="0" role="img" aria-label="${escapeHtml(title)}"><title>${escapeHtml(title)}</title></circle><text x="${x(index)}" y="${height-25}" text-anchor="middle">${escapeHtml(formatExamDate(record.date,true))}</text>`;
            }).join('');
            return `<svg class="exam-chart-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="width:${width}px;min-width:${width}px;margin-inline:auto" role="img" aria-labelledby="examChartTitle examChartDesc"><title id="examChartTitle">${escapeHtml(t('exam_trend') + ' · ' + label)}</title><desc id="examChartDesc">${escapeHtml(t('exam_chart_order'))} ${records.length} ${t('exam_count')}.</desc>${marks}${series}${dots}</svg>`;
        }
        function renderExamChart() {
            const chart = document.getElementById('examChart'); if (!chart) return;
            const records = getVisibleExams();
            const subjects = getExamSubjects(activeExamType,activeExamTrack);
            const count = activeExamSubject === 'total' ? subjects.reduce((sum,subject) => sum+subject.count,0) : subjects.find(subject => subject.id === activeExamSubject)?.count || 0;
            document.getElementById('examChartScope').textContent = examScopeLabel(activeExamType,activeExamTrack) + (ProcatsExamData.profile(activeExamType,activeExamTrack)?.manual ? ' · 0–100' : ` · ${count} ${t('exam_questions')}`);
            const heading=document.querySelector('#view-exams .exam-panel h3'); heading.removeAttribute('data-i18n'); heading.textContent=examMetricLabel(activeExamType,activeExamTrack)+' · '+examText('progress');
            const caption = document.getElementById('examChartCaption'); caption.innerHTML = '';
            if (!records.length) {
                chart.innerHTML = `<div class="exam-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 3v18h18M7 15l4-5 4 3 5-8"/></svg><span>${t('exam_empty_chart')}</span></div>`;
                return;
            }
            chart.innerHTML = buildExamChartSVG(records,activeExamSubject);
            caption.innerHTML = `<span>${t('exam_chart_order')}</span><span>${t('exam_last')}: <strong>${formatExamNet(getExamTotals(records[records.length-1],activeExamSubject).net)}</strong></span>`;
        }

        function openExamModal(id = null) {
            if (id === null && !getSelectedExams().length) { openExamSelection(); return; }
            const record = id === null ? null : examRecords.find(item => item.id === id);
            if (id !== null && !record) { showCustomAlert(t('exam_missing')); return; }
            examEditingId = record?.id || null;
            const type = record?.type || activeExamType || getSelectedExams()[0], track = record ? record.track : (ProcatsExamData.validTrack(type,activeExamTrack) ? activeExamTrack : ProcatsExamData.defaultTrack(type));
            examDraft = {type,track,cache:{},results:{}}; examDraft.cache[examDraftKey()]={};
            if (record) { Object.entries(record.scores).forEach(([key,score]) => { examDraft.cache[examDraftKey()][key] = {...score}; }); examDraft.results[examDraftKey()]=record.result ?? ''; }
            renderExamTypeSelect(type); renderExamTrackSelect('mExamTrack',type,track);
            document.getElementById('mExamTitle').value = record?.title || '';
            document.getElementById('mExamDate').value = record?.date || localDate();
            document.getElementById('mExamType').value = type;
            document.getElementById('mExamTrack').value = track;
            document.getElementById('mExamNotes').value = record?.notes || '';
            document.getElementById('examModalTitle').textContent = t(record ? 'exam_edit_title' : 'exam_new_title');
            document.getElementById('examFormError').textContent = '';
            renderExamFormRows();
            document.getElementById('examModal').classList.add('active');
            document.getElementById('mExamTitle').focus();
        }
        function captureExamDraft() {
            if (!examDraft) return;
            examDraft.cache[examDraftKey()] ||= {};
            if (ProcatsExamData.profile(examDraft.type,examDraft.track)?.manual) { examDraft.results[examDraftKey()]=document.getElementById('mExamResult').value; return; }
            getExamSubjects(examDraft.type,examDraft.track).forEach(subject => {
                const correct = document.getElementById(`exam-${subject.id}-correct`);
                if (!correct) return;
                examDraft.cache[examDraftKey()][subject.id] = {
                    correct:correct.value, wrong:document.getElementById(`exam-${subject.id}-wrong`).value, blank:document.getElementById(`exam-${subject.id}-blank`).value
                };
            });
        }
        function changeExamFormType() {
            if (!examDraft) return;
            captureExamDraft();
            const type=document.getElementById('mExamType').value;
            const track=type===examDraft.type ? document.getElementById('mExamTrack').value : ProcatsExamData.defaultTrack(type);
            examDraft.type=type; examDraft.track=ProcatsExamData.tracks(type).length ? track : null;
            renderExamTrackSelect('mExamTrack',examDraft.type,examDraft.track);
            renderExamFormRows();
        }
        function renderExamFormRows() {
            if (!examDraft) return;
            document.getElementById('mExamTrackWrap').hidden = !ProcatsExamData.tracks(examDraft.type).length;
            examDraft.cache[examDraftKey()] ||= {};
            renderExamFormatInfo();
            const tbody = document.getElementById('examScoreRows'); tbody.innerHTML = '';
            let lastGroup = null;
            getExamSubjects(examDraft.type,examDraft.track).forEach(subject => {
                if (lastGroup !== subject.group) {
                    const groupRow = createExamElement('tr','exam-group-row');
                    const cell = createExamElement('td','',examGroupLabel(subject.group)); cell.colSpan = 5;
                    groupRow.appendChild(cell); tbody.appendChild(groupRow); lastGroup = subject.group;
                }
                const saved = examDraft.cache[examDraftKey()][subject.id] || {correct:0,wrong:0,blank:subject.count};
                const row = createExamElement('tr'); row.id = `exam-row-${subject.id}`;
                const nameCell = createExamElement('td');
                nameCell.appendChild(createExamElement('span','exam-subject-name',examSubjectLabel(subject)));
                nameCell.appendChild(createExamElement('span','exam-question-count',`${subject.count} ${t('exam_questions')}`));
                const error = createExamElement('span','exam-row-error'); error.id = `exam-error-${subject.id}`; nameCell.appendChild(error); row.appendChild(nameCell);
                ['correct','wrong','blank'].forEach(field => {
                    const cell = document.createElement('td'), input = createExamElement('input','exam-number');
                    input.type = 'number'; input.min = '0'; input.max = String(subject.count); input.step = '1'; input.inputMode = 'numeric';
                    input.id = `exam-${subject.id}-${field}`; input.value = String(saved[field]);
                    input.setAttribute('aria-label',examSubjectLabel(subject) + ' · ' + t('exam_' + field));
                    input.setAttribute('aria-describedby',error.id);
                    input.placeholder='0';
                    input.addEventListener('focus',()=>{if(input.value==='0')input.value='';});
                    input.addEventListener('blur',()=>{if(input.value===''&&!input.validity.badInput){input.value='0';updateExamRow(subject.id,field);}});
                    input.addEventListener('input',() => {input.value=input.value.replace(/^0+(?=\d)/,'');updateExamRow(subject.id,field);}); cell.appendChild(input); row.appendChild(cell);
                });
                const netCell = createExamElement('td','exam-net');
                const output = document.createElement('output'); output.id = `exam-net-${subject.id}`; netCell.appendChild(output); row.appendChild(netCell); tbody.appendChild(row);
            });
            updateExamFormTotals();
        }
        function readExamScore(subject) {
            const score = {};
            for (const field of ['correct','wrong','blank']) {
                const input = document.getElementById(`exam-${subject.id}-${field}`);
                score[field] = input && !input.validity?.badInput ? Number(input.value || '0') : NaN;
            }
            return score;
        }
        function updateExamRow(subjectId, field) {
            if (!examDraft) return;
            const subject = getExamSubjects(examDraft.type,examDraft.track).find(item => item.id === subjectId); if (!subject) return;
            if (field === 'correct' || field === 'wrong') {
                const score = readExamScore(subject);
                if (isCount(score.correct) && isCount(score.wrong)) document.getElementById(`exam-${subject.id}-blank`).value = String(Math.max(0,subject.count-score.correct-score.wrong));
            }
            updateExamFormTotals();
        }
        function updateExamFormTotals() {
            if (!examDraft) return false;
            if (ProcatsExamData.profile(examDraft.type,examDraft.track)?.manual) return updateExamManualTotal();
            let correct=0, wrong=0, blank=0, questions=0, valid=true;
            getExamSubjects(examDraft.type,examDraft.track).forEach(subject => {
                const score = readExamScore(subject), rowValid = validExamScore(score,subject.count);
                document.getElementById(`exam-error-${subject.id}`).textContent = rowValid ? '' : t('exam_row_error').replace('{n}',subject.count);
                ['correct','wrong','blank'].forEach(field => document.getElementById(`exam-${subject.id}-${field}`).setAttribute('aria-invalid',String(!rowValid)));
                document.getElementById(`exam-net-${subject.id}`).textContent = rowValid ? formatExamNet(ProcatsExamData.net(score.correct,score.wrong,examDraft.type,examDraft.track)) : '—';
                valid = valid && rowValid; questions += subject.count;
                correct += Number.isFinite(score.correct) ? score.correct : 0;
                wrong += Number.isFinite(score.wrong) ? score.wrong : 0;
                blank += Number.isFinite(score.blank) ? score.blank : 0;
            });
            document.getElementById('examFormNet').textContent = valid ? formatExamNet(ProcatsExamData.net(correct,wrong,examDraft.type,examDraft.track)) : '—';
            document.getElementById('examFormCounts').textContent = `${correct} ${t('exam_correct')} · ${wrong} ${t('exam_wrong')} · ${blank} ${t('exam_blank')} / ${questions} ${t('exam_questions')}`;
            document.getElementById('examFormError').textContent = valid ? '' : t('exam_bad_scores');
            return valid;
        }
        function saveExam() {
            if (!examDraft) return false;
            const title = document.getElementById('mExamTitle').value.trim(), date = document.getElementById('mExamDate').value;
            const notes = document.getElementById('mExamNotes').value.trim(), error = document.getElementById('examFormError');
            if (!title || title.length>140) { error.textContent=t('exam_bad_title'); document.getElementById('mExamTitle').focus(); return false; }
            if (!isExamDate(date)) { error.textContent=t('exam_bad_date'); document.getElementById('mExamDate').focus(); return false; }
            if (notes.length>3000) { error.textContent=t('exam_bad_notes'); return false; }
            if (!updateExamFormTotals()) { document.querySelector('#examModal [aria-invalid="true"]')?.focus(); return false; }
            const previous = examEditingId ? examRecords.find(record => record.id === examEditingId) : null;
            if (examEditingId && !previous) { error.textContent=t('exam_missing'); return false; }
            const scores = {};
            getExamSubjects(examDraft.type,examDraft.track).forEach(subject => { scores[subject.id] = readExamScore(subject); });
            const record = {id:previous?.id || createId(), type:examDraft.type, track:ProcatsExamData.tracks(examDraft.type).length ? examDraft.track : null, title, date, notes, scores,
                createdAt:previous?.createdAt || Date.now(), updatedAt:Date.now()};
            if (ProcatsExamData.profile(record.type,record.track)?.manual) record.result=Number(document.getElementById('mExamResult').value);
            if (!validateExamRecords([record])) { error.textContent=t('exam_bad_scores'); return false; }
            const next = previous ? examRecords.map(item => item.id === record.id ? record : item) : [...examRecords,record];
            if(typeof canSaveSection==='function'&&!canSaveSection('procats_exams_v1',next)){error.textContent=t('exam_save_error')+' · 850 KB';return false;}
            if (!appStorage.setItem('procats_exams_v1',JSON.stringify(next))) { error.textContent=t('exam_save_error'); return false; }
            examRecords = next; activeExamType=record.type; activeExamTrack=record.track;
            closeModal('examModal'); renderExams(); return true;
        }
        function deleteExam(id) {
            const record = examRecords.find(item => item.id === id); if (!record) return;
            showCustomConfirm(t('exam_delete').replace('{name}',record.title),() => {
                const next = examRecords.filter(item => item.id !== id);
                if (!appStorage.setItem('procats_exams_v1',JSON.stringify(next))) { showCustomAlert(t('exam_save_error')); return; }
                examRecords = next; renderExams();
            });
        }
        window.addEventListener('resize', () => {
            if (document.getElementById('view-exams')?.classList.contains('active')) renderExamChart();
        });

        window.procatsInitialize = () => {
            loadTheme();
            setLang(currentLang);
            renderHeatmap();
            renderNotes();
            renderBookmarks();
            
            renderApp();
            renderObsidian();
           

            let savedSw = readStoredJSON('procats_sw', null);
            if(savedSw) {
                swSavedTime = savedSw.savedTime;
                if(savedSw.isRunning) {
                    swStartTime=savedSw.startTime;swRunning=true;durationClock()?.elapsed(swStartTime);swRefreshScheduler();
                    const btn = document.getElementById('swStartBtn'); btn.innerText = t('btn_pause'); btn.style.background = "#38383a"; btn.style.color = "white"; 
                } else {swRunning=false;swUpdateDisplay(swSavedTime);}
            }

            let savedTimer = readStoredJSON('procats_timer', null);
            if(savedTimer) {
                tDuration=Number.isSafeInteger(savedTimer.duration)&&savedTimer.duration>0?savedTimer.duration:savedTimer.remainingTime;
                if(savedTimer.isRunning) {
                    tEndTime=savedTimer.endTime;tTime=Math.max(0,Math.ceil(timerRemainingMs()/1000));
                    if(tTime>0)startTimer(true);else{tTime=0;tEndTime=0;tUpdateDisplay();appStorage.removeItem('procats_timer');}
                } else if (!savedTimer.isRunning) {
                    tTime = savedTimer.remainingTime || 0; tUpdateDisplay();
                }
            }
        };
