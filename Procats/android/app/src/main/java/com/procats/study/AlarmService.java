package com.procats.study;
import android.app.*;import android.content.*;import android.content.pm.ServiceInfo;import android.media.*;import android.os.*;
public class AlarmService extends Service {
 private MediaPlayer player;private Vibrator vibrator;private PowerManager.WakeLock lock;
 @Override public IBinder onBind(Intent intent){return null;}
 @Override public int onStartCommand(Intent i,int flags,int startId){if(AlarmState.prefs(this).getBoolean("dismissed",false)||!AlarmState.notifications(this)){stopSelf();return START_NOT_STICKY;}
 if(Build.VERSION.SDK_INT>=34)startForeground(AlarmState.ID,AlarmState.notification(this),ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);else startForeground(AlarmState.ID,AlarmState.notification(this));if(player!=null||vibrator!=null)return START_NOT_STICKY;
 lock=getSystemService(PowerManager.class).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK,"Procats:TimerAlert");lock.acquire(60*60*1000L);String mode=AlarmState.prefs(this).getString("mode","sound");
 if("vibrate".equals(mode)){vibrator=(Vibrator)getSystemService(VIBRATOR_SERVICE);if(vibrator!=null&&vibrator.hasVibrator())vibrator.vibrate(VibrationEffect.createWaveform(new long[]{0,450,450,450,1200},0),new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).build());}
 else if("sound".equals(mode))try{player=new MediaPlayer();player.setWakeMode(this,PowerManager.PARTIAL_WAKE_LOCK);player.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());int raw=getResources().getIdentifier("procats_alarm","raw",getPackageName());if(raw!=0){try(android.content.res.AssetFileDescriptor fd=getResources().openRawResourceFd(raw)){player.setDataSource(fd.getFileDescriptor(),fd.getStartOffset(),fd.getLength());}}else player.setDataSource(this,RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM));player.setLooping(true);player.prepare();player.start();}catch(Exception e){if(player!=null){player.release();player=null;}}return START_NOT_STICKY;}
 @Override public void onDestroy(){if(player!=null){player.release();player=null;}if(vibrator!=null)vibrator.cancel();if(lock!=null&&lock.isHeld())lock.release();super.onDestroy();}
}
