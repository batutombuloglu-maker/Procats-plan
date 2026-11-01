package com.procats.study;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.procats.companion.*;
import android.appwidget.AppWidgetManager;
import android.content.*;
import org.json.*;

@CapacitorPlugin(name="ProcatsCompanion")
public class ProcatsCompanionPlugin extends Plugin {
 private Store store(){return new Store(getContext());}
 @PluginMethod public void wearStatus(PluginCall c){JSObject r=new JSObject();r.put("enabled",store().wearEnabled());c.resolve(r);}
 @PluginMethod public void setWear(PluginCall c){try{store().enableWear(c.getBoolean("enabled",false));Transport.send(getContext());JSObject r=new JSObject();r.put("scope",store().pending().optString("scope"));c.resolve(r);}catch(Exception e){c.reject("Watch setting unavailable");}}
 @PluginMethod public void takeOpen(PluginCall c){JSObject r=new JSObject();boolean open=getActivity().getIntent().getBooleanExtra("procatsCompanion",false);getActivity().getIntent().removeExtra("procatsCompanion");r.put("open",open);c.resolve(r);}
 @PluginMethod public void bind(PluginCall c){try{JSObject r=new JSObject();r.put("scope",store().bind(c.getString("account","")));c.resolve(r);}catch(Exception e){c.reject("Device account unavailable");}}
 @PluginMethod public void pending(PluginCall c){try{c.resolve(new JSObject(store().pending().toString()));}catch(Exception e){c.reject("Device queue unavailable");}}
 @PluginMethod public void publish(PluginCall c){try{store().publish(c.getString("scope",""),c.getObject("snapshot",new JSObject()),c.getArray("results",new JSArray()));ProcatsWidget.updateAll(getContext());Transport.send(getContext());c.resolve();}catch(Exception e){c.reject("Device update failed");}}
 @PluginMethod public void lock(PluginCall c){try{store().lock();ProcatsWidget.updateAll(getContext());Transport.send(getContext());c.resolve();}catch(Exception e){c.reject("Device lock failed");}}
 @PluginMethod public void erase(PluginCall c){try{store().eraseAccount(c.getString("account",""));ProcatsWidget.updateAll(getContext());Transport.send(getContext());c.resolve();}catch(Exception e){c.reject("Device cleanup failed");}}
 @PluginMethod public void pin(PluginCall c){getActivity().runOnUiThread(()->{AppWidgetManager m=AppWidgetManager.getInstance(getContext());boolean supported=m.isRequestPinAppWidgetSupported();if(supported)m.requestPinAppWidget(new ComponentName(getContext(),"today".equals(c.getString("kind"))?TodayWidget.class:FocusWidget.class),null,null);JSObject r=new JSObject();r.put("supported",supported);c.resolve(r);});}
}
