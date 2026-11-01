package com.procats.study;
import com.getcapacitor.*;import com.getcapacitor.annotation.CapacitorPlugin;import android.app.*;import android.content.*;import android.net.Uri;import android.os.Build;import android.os.SystemClock;import android.provider.Settings;
@CapacitorPlugin(name="ProcatsAlarm")
public class ProcatsAlarmPlugin extends Plugin {
 @PluginMethod public void status(PluginCall call){JSObject v=new JSObject();v.put("exact",AlarmState.exact(getContext()));v.put("fullScreen",AlarmState.fullScreen(getContext()));v.put("notifications",AlarmState.notifications(getContext()));v.put("endTime",AlarmState.prefs(getContext()).getLong("end",0));v.put("remainingMs",Math.max(0,AlarmState.remaining(getContext())));v.put("wallTimeMs",System.currentTimeMillis());v.put("elapsedRealtimeMs",SystemClock.elapsedRealtime());v.put("bootId",AlarmState.bootId(getContext()));v.put("dismissed",AlarmState.prefs(getContext()).getBoolean("dismissed",false));v.put("ringing",AlarmState.prefs(getContext()).getBoolean("ringing",false));call.resolve(v);}
 @PluginMethod public void schedule(PluginCall call) {
  Long end=call.getLong("endTime");
  Long remaining=call.getLong("remainingMs");if(remaining==null)remaining=end==null?0:end-System.currentTimeMillis();
  if(end==null||end<=0||remaining<=0||remaining>9007199254740991L-SystemClock.elapsedRealtime()){call.reject("Invalid timer");return;}
  android.content.SharedPreferences p=AlarmState.prefs(getContext());
  if(p.getLong("end",0)==end&&p.getBoolean("dismissed",false)){call.resolve();return;}
  AlarmState.stop(getContext());
  p.edit().putLong("end",end).putLong("elapsedEnd",SystemClock.elapsedRealtime()+remaining).putString("bootId",AlarmState.bootId(getContext())).putString("mode",call.getString("mode","sound"))
   .putBoolean("wake",call.getBoolean("wake",false))
   .putString("message",call.getString("message","Süre tamamlandı"))
   .putString("close",call.getString("close","Kapat"))
   .putString("background",AlarmState.validColor(call.getString("background"),"#121820"))
   .putString("foreground",AlarmState.validColor(call.getString("foreground"),"#FFFFFF"))
   .putString("accent",AlarmState.validColor(call.getString("accent"),"#65A9FF"))
   .putBoolean("dismissed",false).putBoolean("ringing",false).commit();
  try{AlarmState.schedule(getContext());JSObject r=new JSObject();r.put("exact",AlarmState.exact(getContext()));call.resolve(r);}
  catch(Exception e){call.reject("Cannot schedule alarm",e);}
 }
 @PluginMethod public void cancel(PluginCall c){AlarmState.stop(getContext());c.resolve();}@PluginMethod public void dismiss(PluginCall c){AlarmState.stop(getContext());c.resolve();}
 @PluginMethod public void permission(PluginCall call){try{String kind=call.getString("kind","notifications");Intent i;if("exact".equals(kind)&&Build.VERSION.SDK_INT>=31)i=new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,Uri.parse("package:"+getContext().getPackageName()));else if("screen".equals(kind)&&Build.VERSION.SDK_INT>=34)i=new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,Uri.parse("package:"+getContext().getPackageName()));else i=new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE,getContext().getPackageName());getActivity().startActivity(i);call.resolve();}catch(Exception e){call.reject("Cannot open permission settings",e);}}
}
