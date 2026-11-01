package com.procats.study;

import android.app.*;
import android.appwidget.*;
import android.content.*;
import android.graphics.*;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;
import com.procats.companion.*;
import org.json.*;

public class ProcatsWidget extends AppWidgetProvider {
 private static final String ACT="com.procats.companion.TASK";
 @Override public void onUpdate(Context c,AppWidgetManager m,int[] ids){for(int id:ids)render(c,m,id,this instanceof TodayWidget);}
 @Override public void onAppWidgetOptionsChanged(Context c,AppWidgetManager m,int id,Bundle options){render(c,m,id,this instanceof TodayWidget);}
 @Override public void onReceive(Context c,Intent i){
  if(ACT.equals(i.getAction())){
   Store s=new Store(c);JSONObject v=s.view();String scope=i.getStringExtra("scope"),task=i.getStringExtra("task");
   if(v.optString("scope").equals(scope)&&Model.today().equals(i.getStringExtra("date"))){
    String action=i.getStringExtra("action");JSONObject t=Model.find(v,task==null?"":task);
    // PendingIntents carry the rendered task/version: a stale tap never affects the next task.
    if("undo".equals(action)){JSONObject last=Model.object(v,"last");if(last.optString("id").equals(i.getStringExtra("last")))s.undo();}
    else if(("done".equals(action)||"missed".equals(action))&&t!=null&&t.optInt("status")==i.getIntExtra("before",-1)&&t.optString("identity").equals(i.getStringExtra("identity")))s.act(task,"done".equals(action)?1:2);
    updateAll(c);PendingResult pending=goAsync();java.util.concurrent.atomic.AtomicBoolean finished=new java.util.concurrent.atomic.AtomicBoolean();Runnable finish=()->{if(finished.compareAndSet(false,true))pending.finish();};new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(finish,8000);Transport.send(c).addOnCompleteListener(r->finish.run());
   }
   return;
  }
  super.onReceive(c,i);
  if(Intent.ACTION_DATE_CHANGED.equals(i.getAction())||Intent.ACTION_TIMEZONE_CHANGED.equals(i.getAction())||Intent.ACTION_BOOT_COMPLETED.equals(i.getAction()))updateAll(c);
 }
 static int color(JSONObject colors,String key,int fallback){try{return Color.parseColor(colors.optString(key));}catch(Exception e){return fallback;}}
 static PendingIntent open(Context c){Intent i=new Intent(c,MainActivity.class).setAction(Intent.ACTION_VIEW).putExtra("procatsCompanion",true).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_SINGLE_TOP);return PendingIntent.getActivity(c,7200,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);}
 static PendingIntent action(Context c,JSONObject v,JSONObject t,String action,boolean large){
  String id=t==null?"":t.optString("id"),scope=v.optString("scope"),token=t==null?"":t.optString("identity"),last=Model.object(v,"last").optString("id");
  Intent i=new Intent(c,large?TodayWidget.class:FocusWidget.class).setAction(ACT).setData(Uri.parse("procats-widget://action/"+scope+"/"+Uri.encode(id)+"/"+action+"/"+token+"/"+last));
  i.putExtra("scope",scope).putExtra("date",v.optString("date")).putExtra("task",id).putExtra("identity",token).putExtra("before",t==null?-1:t.optInt("status")).putExtra("last",last).putExtra("action",action);
  return PendingIntent.getBroadcast(c,0,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
 }
 static void render(Context c,AppWidgetManager m,int id,boolean large){
  JSONObject v=new Store(c).view(),t=Model.next(v),colors=Model.object(v,"colors");
  boolean locked=v.optString("scope").isEmpty(),stale=!Model.today().equals(v.optString("date")),actionable=!locked&&!stale&&t!=null;
  int accent=color(colors,"accent",0xff168cff),bg=color(colors,"background",0xff202126),text=color(colors,"text",0xfff5f5f7);
  RemoteViews r=new RemoteViews(c.getPackageName(),large?R.layout.widget_today:R.layout.widget_focus);
  r.setImageViewBitmap(R.id.widget_surface,surface(bg));r.setTextColor(R.id.widget_title,text);r.setTextColor(R.id.widget_summary,text);r.setTextColor(R.id.widget_brand,accent);r.setTextColor(R.id.widget_detail,text);r.setTextColor(R.id.widget_status,(text&0x00ffffff)|0xbb000000);
  r.setTextViewText(R.id.widget_brand,"P R O C A T S   ·   "+Words.get(v,"today"));
  r.setTextViewText(R.id.widget_summary,v.optInt("done")+" / "+v.optInt("total"));
  r.setTextViewText(R.id.widget_title,locked?Words.get(v,"locked"):stale?Words.get(v,"stale"):t!=null?t.optString("title"):Words.get(v,v.optInt("total")==0?"empty":"finished"));
  String detail=locked?Words.get(v,"lockedHelp"):stale?Words.get(v,"open"):actionable?t.optString("desc"):Words.get(v,v.optInt("total")==0?"emptyHelp":"finishedHelp");
  r.setTextViewText(R.id.widget_detail,"-".equals(detail)?"":detail);
  r.setViewVisibility(R.id.widget_actions,actionable?View.VISIBLE:View.GONE);
  r.setTextViewText(R.id.widget_done,"✓  "+Words.get(v,"done"));r.setTextViewText(R.id.widget_missed,"–  "+Words.get(v,"missed"));
  if(actionable){r.setOnClickPendingIntent(R.id.widget_done,action(c,v,t,"done",large));r.setOnClickPendingIntent(R.id.widget_missed,action(c,v,t,"missed",large));}
  r.setOnClickPendingIntent(R.id.widget_root,open(c));
  boolean undo=Model.undoable(v,Model.object(v,"last"));r.setViewVisibility(R.id.widget_undo,undo?View.VISIBLE:View.GONE);r.setTextViewText(R.id.widget_undo,"↶ "+Words.get(v,"undo"));if(undo)r.setOnClickPendingIntent(R.id.widget_undo,action(c,v,null,"undo",large));
  r.setTextViewText(R.id.widget_status,Words.get(v,v.optBoolean("issue")?"changed":v.optInt("pending")>0||v.optBoolean("cloudPending")?"pending":"ready"));
  r.setImageViewBitmap(R.id.widget_ring,ring(v.optInt("done"),v.optInt("total"),accent));r.setViewVisibility(R.id.widget_ring,undo?View.GONE:View.VISIBLE);
  if(large){StringBuilder next=new StringBuilder();JSONArray tasks=Model.array(v,"tasks");int count=0;for(int x=0;x<tasks.length()&&count<2;x++){JSONObject item=tasks.optJSONObject(x);if(item.optInt("status")==0&&item!=t){if(t!=null&&item.optString("id").equals(t.optString("id")))continue;if(count++>0)next.append("\n");next.append("○  ").append(item.optString("title"));}}r.setTextViewText(R.id.widget_next,stale||locked?"":next.toString());r.setTextColor(R.id.widget_next,text);}
  m.updateAppWidget(id,r);
 }
 static Bitmap surface(int color){Bitmap b=Bitmap.createBitmap(512,512,Bitmap.Config.ARGB_8888);Canvas canvas=new Canvas(b);Paint paint=new Paint(3);paint.setColor(color);canvas.drawRoundRect(0,0,512,512,40,40,paint);return b;}
 static Bitmap ring(int done,int total,int accent){Bitmap b=Bitmap.createBitmap(88,88,Bitmap.Config.ARGB_8888);Canvas c=new Canvas(b);Paint p=new Paint(3);p.setStyle(Paint.Style.STROKE);p.setStrokeWidth(7);p.setColor(0x304f9fff);c.drawCircle(44,44,36,p);p.setColor(accent);p.setStrokeCap(Paint.Cap.ROUND);c.drawArc(8,8,80,80,-90,total==0?0:360f*done/total,false,p);return b;}
 public static void updateAll(Context c){AppWidgetManager m=AppWidgetManager.getInstance(c);for(Class<?> cls:new Class<?>[]{FocusWidget.class,TodayWidget.class})for(int id:m.getAppWidgetIds(new ComponentName(c,cls)))render(c,m,id,cls==TodayWidget.class);}
}
