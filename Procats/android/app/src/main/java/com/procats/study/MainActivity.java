package com.procats.study;

import com.getcapacitor.BridgeActivity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Notification;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Bundle;
import android.content.Intent;
import com.getcapacitor.JSObject;
import androidx.core.view.WindowCompat;

public class MainActivity extends BridgeActivity {
    private final android.content.BroadcastReceiver companionUpdates = new android.content.BroadcastReceiver(){
        @Override public void onReceive(android.content.Context c, Intent i){if(bridge!=null)runOnUiThread(()->bridge.triggerWindowJSEvent("procats-companion-change"));}
    };
    @Override public void onStart(){super.onStart();android.content.IntentFilter f=new android.content.IntentFilter(com.procats.companion.Store.CHANGED);androidx.core.content.ContextCompat.registerReceiver(this,companionUpdates,f,androidx.core.content.ContextCompat.RECEIVER_NOT_EXPORTED);com.procats.companion.Transport.refresh(this);}
    @Override public void onStop(){unregisterReceiver(companionUpdates);super.onStop();}
    private JSObject pendingResource = new JSObject();
    private synchronized void captureResourceShare(Intent intent) {
        if(intent==null || !Intent.ACTION_SEND.equals(intent.getAction()) || !"text/plain".equals(intent.getType())) return;
        CharSequence text=intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
        if(text==null || text.length()>16000) return;
        pendingResource=new JSObject();pendingResource.put("id",java.util.UUID.randomUUID().toString());
        pendingResource.put("text",text.toString());String title=intent.getStringExtra(Intent.EXTRA_SUBJECT);
        pendingResource.put("title",title==null?"":title.substring(0,Math.min(180,title.length())));
    }
    public synchronized JSObject resourceShare(){return pendingResource;}
    public synchronized void acknowledgeResourceShare(String id){if(id.equals(pendingResource.optString("id"))){pendingResource=new JSObject();setIntent(new Intent(this,MainActivity.class).setAction(Intent.ACTION_MAIN));}}
    @Override protected void onNewIntent(Intent intent){super.onNewIntent(intent);setIntent(intent);captureResourceShare(intent);if(bridge!=null&&intent.getBooleanExtra("procatsCompanion",false))bridge.triggerWindowJSEvent("procats-companion-open");if(bridge!=null)bridge.triggerWindowJSEvent("procats-share-available");}
    @Override public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ProcatsCompanionPlugin.class);
        registerPlugin(ProcatsDevicePlugin.class);
        registerPlugin(ProcatsAlarmPlugin.class);
        registerPlugin(ProcatsResourcesPlugin.class);
        super.onCreate(savedInstanceState);
        WindowCompat.enableEdgeToEdge(getWindow());
        captureResourceShare(getIntent());
        NotificationManager manager = getSystemService(NotificationManager.class);
        for (String mode : new String[]{"sound", "vibrate", "silent"}) {
            NotificationChannel channel = new NotificationChannel("procats-timer-" + mode + "-v1", "Procats timer · " + mode, NotificationManager.IMPORTANCE_HIGH);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PRIVATE);
            channel.enableVibration(mode.equals("vibrate"));
            if (mode.equals("vibrate")) channel.setVibrationPattern(new long[]{0, 250, 150, 250});
            channel.setSound(mode.equals("sound") ? RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION) : null,
                new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT).build());
            manager.createNotificationChannel(channel);
        }
    }
}
