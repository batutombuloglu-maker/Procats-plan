package com.procats.companion;
import org.json.JSONObject;
public final class Words {
 public static String get(JSONObject v,String key){String lang=v.optString("lang","tr");boolean en=lang.equals("en"),de=lang.equals("de");
  switch(key){
   case "today":return en?"Today":de?"Heute":"Bugün";
   case "done":return en?"Done":de?"Erledigt":"Yapıldı";
   case "missed":return en?"Not done":de?"Nicht erledigt":"Yapılmadı";
   case "undo":return en?"Undo":de?"Rückgängig":"Geri al";
   case "open":return en?"Open Procats":de?"Procats öffnen":"Procats’ı aç";
   case "next":return en?"UP NEXT":de?"ALS NÄCHSTES":"SIRADAKİ GÖREV";
   case "empty":return en?"A fresh start":de?"Ein neuer Anfang":"Yeni bir başlangıç";
   case "emptyHelp":return en?"Add today's tasks in Procats on your phone.":de?"Plane heute in Procats auf deinem Telefon.":"Bugünün görevlerini telefondaki Procats’tan ekle.";
   case "finished":return en?"Today's plan reviewed":de?"Tagesplan durchgesehen":"Bugünün planını işaretledin";
   case "finishedHelp":return en?"All tasks have a result. Review them in Procats.":de?"Alle Aufgaben sind markiert. In Procats ansehen.":"Her görevi işaretledin. Sonuçları Procats’ta inceleyebilirsin.";
   case "locked":return en?"Start on your phone":de?"Am Telefon starten":"Telefonda başla";
   case "lockedHelp":return en?"Open Procats on your paired Android phone and sign in.":de?"Öffne Procats auf deinem gekoppelten Android-Telefon und melde dich an.":"Eşlenmiş Android telefonunda Procats’ı aç ve hesabına gir.";
   case "stale":return en?"Open the phone for today's plan":de?"Für den Tagesplan am Telefon öffnen":"Bugünün planı için telefonda aç";
   case "pending":return en?"Saved · open phone to sync":de?"Gespeichert · am Telefon synchronisieren":"Kaydedildi · eşitlemek için telefonda aç";
   case "ready":return en?"Phone's last saved plan":de?"Zuletzt gespeicherter Plan":"Telefondaki son kayıt";
   case "changed":return en?"A task changed. Check your phone.":de?"Aufgabe geändert. Telefon prüfen.":"Bir görev değişmiş. Telefonda kontrol et.";
   case "refresh":return en?"Refresh":de?"Aktualisieren":"Yenile";
   case "more":return en?"More tasks in Procats":de?"Weitere Aufgaben in Procats":"Diğer görevler Procats’ta";
   default:return key;
  }
 }
 private Words(){}
}
