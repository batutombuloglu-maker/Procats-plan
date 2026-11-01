package com.procats.study;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

public class AlarmActivity extends Activity {
 private boolean receiverRegistered;
 private int dp(int value){return Math.round(value*getResources().getDisplayMetrics().density);}
 private final BroadcastReceiver closed=new BroadcastReceiver(){
  @Override public void onReceive(Context context,Intent intent){finish();}
 };

 @Override public void onCreate(Bundle state) {
  super.onCreate(state);
  WindowCompat.enableEdgeToEdge(getWindow());
  boolean wake=AlarmState.prefs(this).getBoolean("wake",false);
  if(Build.VERSION.SDK_INT>=27){setShowWhenLocked(true);setTurnScreenOn(wake);}
  else {
   getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED);
   if(wake)getWindow().addFlags(WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
  }

  int background=AlarmState.themeColor(this,"background","#121820");
  int foreground=AlarmState.themeColor(this,"foreground","#FFFFFF");
  int accent=AlarmState.themeColor(this,"accent","#65A9FF");
  ScrollView scroll=new ScrollView(this);
  scroll.setFillViewport(true);
  scroll.setBackgroundColor(background);
  LinearLayout box=new LinearLayout(this);
  box.setOrientation(LinearLayout.VERTICAL);
  box.setGravity(Gravity.CENTER);
  box.setPadding(dp(24),dp(32),dp(24),dp(32));
  scroll.addView(box,new ScrollView.LayoutParams(-1,-1));
  ViewCompat.setOnApplyWindowInsetsListener(scroll,(view,insets)->{
   androidx.core.graphics.Insets bars=insets.getInsets(WindowInsetsCompat.Type.systemBars()|WindowInsetsCompat.Type.displayCutout());
   box.setPadding(dp(24)+bars.left,dp(32)+bars.top,dp(24)+bars.right,dp(32)+bars.bottom);
   return insets;
  });

  TextView brand=label("PROCATS",21,accent);
  brand.setTypeface(Typeface.create("sans-serif-medium",Typeface.NORMAL));
  brand.setLetterSpacing(0.12f);
  box.addView(brand);
  TextView time=label("00:00",68,foreground);
  time.setTypeface(Typeface.create("sans-serif-light",Typeface.NORMAL));
  time.setFontFeatureSettings("tnum");
  LinearLayout.LayoutParams timeLayout=new LinearLayout.LayoutParams(-1,-2);
  timeLayout.topMargin=dp(24);
  timeLayout.bottomMargin=dp(16);
  box.addView(time,timeLayout);
  TextView message=label(AlarmState.prefs(this).getString("message","Süre tamamlandı"),20,foreground);
  box.addView(message,new LinearLayout.LayoutParams(-1,-2));

  Button stop=new Button(this);
  stop.setText(AlarmState.prefs(this).getString("close","Kapat"));
  stop.setAllCaps(false);
  stop.setTextSize(18);
  stop.setTypeface(Typeface.create("sans-serif-medium",Typeface.NORMAL));
  stop.setMinHeight(dp(56));
  stop.setPadding(dp(24),dp(12),dp(24),dp(12));
  stop.setBackgroundTintList(ColorStateList.valueOf(accent));
  stop.setTextColor(Color.luminance(accent)>0.179?Color.BLACK:Color.WHITE);
  stop.setOnClickListener(view->{AlarmState.stop(this);finish();});
  LinearLayout.LayoutParams buttonLayout=new LinearLayout.LayoutParams(-1,-2);
  buttonLayout.topMargin=dp(32);
  box.addView(stop,buttonLayout);
  setContentView(scroll);
  scroll.requestApplyInsets();
  WindowInsetsControllerCompat bars=WindowCompat.getInsetsController(getWindow(),scroll);
  bars.setAppearanceLightStatusBars(Color.luminance(background)>0.5);
  bars.setAppearanceLightNavigationBars(Color.luminance(background)>0.5);
  androidx.core.content.ContextCompat.registerReceiver(this,closed,new IntentFilter(AlarmState.CLOSED),androidx.core.content.ContextCompat.RECEIVER_NOT_EXPORTED);
  receiverRegistered=true;
 }

 private TextView label(String text,int size,int color){
  TextView view=new TextView(this);
  view.setText(text);view.setTextColor(color);view.setTextSize(size);
  view.setTypeface(Typeface.create("sans-serif",Typeface.NORMAL));
  view.setGravity(Gravity.CENTER);
  return view;
 }
 @Override protected void onResume(){super.onResume();if(!AlarmState.prefs(this).getBoolean("ringing",false))finish();}
 @Override protected void onDestroy(){if(receiverRegistered)unregisterReceiver(closed);super.onDestroy();}
}
