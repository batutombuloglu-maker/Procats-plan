package com.procats.study;

import android.app.*;
import android.os.*;
import android.content.*;
import android.graphics.*;
import android.graphics.drawable.GradientDrawable;
import android.view.*;
import android.widget.*;
import com.procats.companion.*;
import org.json.*;
import androidx.wear.tiles.TileService;

/** Native round-screen UI: no WebView, sensors, wake locks or continuous polling. */
public class WatchActivity extends Activity {
 private ScrollView scroll;private LinearLayout column;private int accent=0xff309aff;private String selected="";private boolean started;
 private final Handler handler=new Handler(Looper.getMainLooper());
 private final BroadcastReceiver updates=new BroadcastReceiver(){@Override public void onReceive(Context c,Intent i){handler.post(()->render(true));}};
 private final Runnable midnight=new Runnable(){public void run(){if(started){render(true);handler.postDelayed(this,60000);}}};
 @Override public void onCreate(Bundle b){super.onCreate(b);getWindow().setStatusBarColor(Color.BLACK);getWindow().setNavigationBarColor(Color.BLACK);scroll=new ScrollView(this);scroll.setBackgroundColor(Color.BLACK);scroll.setFillViewport(true);scroll.setClipToPadding(false);scroll.setVerticalScrollBarEnabled(false);
  column=new LinearLayout(this);column.setOrientation(LinearLayout.VERTICAL);column.setGravity(Gravity.CENTER_HORIZONTAL);column.setPadding(dp(24),dp(20),dp(24),dp(30));scroll.addView(column,new ScrollView.LayoutParams(-1,-2));setContentView(scroll);
  scroll.setFocusable(true);scroll.setOnGenericMotionListener((v,event)->{if(event.getAction()==MotionEvent.ACTION_SCROLL){scroll.scrollBy(0,(int)(-event.getAxisValue(MotionEvent.AXIS_SCROLL)*dp(40)));return true;}return false;});render(false);
 }
 @Override protected void onStart(){super.onStart();started=true;androidx.core.content.ContextCompat.registerReceiver(this,updates,new IntentFilter(Store.CHANGED),androidx.core.content.ContextCompat.RECEIVER_NOT_EXPORTED);Transport.refresh(this);handler.postDelayed(midnight,60000);render(true);}
 @Override protected void onStop(){started=false;handler.removeCallbacks(midnight);unregisterReceiver(updates);super.onStop();}
 int dp(float n){return Math.round(n*getResources().getDisplayMetrics().density);}
 TextView label(String text,float size,int color){TextView t=new TextView(this);t.setText(text);t.setTextSize(size);t.setTextColor(color);t.setGravity(Gravity.CENTER);t.setPadding(0,dp(3),0,dp(3));t.setFontFeatureSettings("tnum");column.addView(t,new LinearLayout.LayoutParams(-1,-2));return t;}
 GradientDrawable pill(int color){GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(dp(24));return d;}
 Button button(String text,int color,Runnable action){Button b=new Button(this);b.setText(text);b.setAllCaps(false);b.setTextSize(14);b.setTextColor(Color.WHITE);b.setBackground(pill(color));b.setMinHeight(dp(48));b.setMinimumWidth(0);b.setPadding(dp(8),0,dp(8),0);LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,dp(48));p.topMargin=dp(8);column.addView(b,p);b.setOnClickListener(v->{b.performHapticFeedback(HapticFeedbackConstants.CONFIRM);action.run();});return b;}
 void send(){Transport.send(this).addOnFailureListener(e->Toast.makeText(this,"Bağlantı bekleniyor; işaretin bu saatte saklı.",Toast.LENGTH_SHORT).show());TileService.getUpdater(this).requestUpdate(TodayTile.class);render(false);}
 void mark(JSONObject v,JSONObject t,int after){JSONObject latest=new Store(this).view(),current=Model.find(latest,t.optString("id"));if(current!=null&&latest.optString("scope").equals(v.optString("scope"))&&current.optInt("status")==t.optInt("status")&&current.optString("identity").equals(t.optString("identity"))){new Store(this).act(t.optString("id"),after);selected="";send();}}
 void render(boolean keepScroll){
  if(column==null)return;int y=scroll.getScrollY();JSONObject v=new Store(this).view();try{accent=Color.parseColor(Model.object(v,"colors").optString("accent","#309aff"));}catch(Exception ignored){}float[] hsv=new float[3];Color.colorToHSV(accent,hsv);hsv[2]=Math.max(.65f,hsv[2]);accent=Color.HSVToColor(hsv);
  column.removeAllViews();label("PROCATS  ·  "+v.optInt("done")+" / "+v.optInt("total"),11,accent);
  boolean locked=v.optString("scope").isEmpty(),stale=!Model.today().equals(v.optString("date"));
  if(locked||stale){label(Words.get(v,locked?"locked":"stale"),20,Color.WHITE);label(Words.get(v,"lockedHelp"),13,0xffb0b7c4);button(Words.get(v,"refresh"),0xff1c2532,()->Transport.refresh(this));}
  else{
   Progress ring=new Progress(this,v.optInt("done"),v.optInt("total"),accent);column.addView(ring,new LinearLayout.LayoutParams(-1,dp(6)));
   JSONObject chosen=selected.isEmpty()?null:Model.find(v,selected);if(chosen==null)chosen=Model.next(v);final JSONObject task=chosen;
   if(task==null){label(Words.get(v,v.optInt("total")==0?"empty":"finished"),20,Color.WHITE);label(Words.get(v,v.optInt("total")==0?"emptyHelp":"finishedHelp"),13,0xffb0b7c4);}
   else{
    TextView title=label(task.optString("title"),19,Color.WHITE);title.setTypeface(null,Typeface.BOLD);title.setMaxLines(2);title.setEllipsize(android.text.TextUtils.TruncateAt.END);title.setOnClickListener(w->new AlertDialog.Builder(this).setTitle(task.optString("title")).setMessage(task.optString("desc")).setPositiveButton("Tamam",null).show());
    String desc=task.optString("desc");if(!desc.isEmpty()&&!desc.equals("-")){TextView d=label(desc,12,0xffbcc4d0);d.setMaxLines(1);d.setEllipsize(android.text.TextUtils.TruncateAt.END);}
    Button done=button("✓  "+Words.get(v,"done"),0xff135994,()->mark(v,task,1)),missed=button("–  "+Words.get(v,"missed"),0xff222934,()->mark(v,task,2));
    column.removeView(done);column.removeView(missed);LinearLayout row=new LinearLayout(this);row.setOrientation(LinearLayout.HORIZONTAL);LinearLayout.LayoutParams cell=new LinearLayout.LayoutParams(0,dp(48),1);cell.setMarginEnd(dp(5));row.addView(done,cell);row.addView(missed,new LinearLayout.LayoutParams(0,dp(48),1));done.setTextSize(11);missed.setTextSize(11);LinearLayout.LayoutParams rp=new LinearLayout.LayoutParams(-1,dp(48));rp.topMargin=dp(8);column.addView(row,rp);
   }
   JSONObject last=Model.object(v,"last");if(Model.undoable(v,last))button("↶  "+Words.get(v,"undo"),0xff19212c,()->{if(last.optString("id").equals(Model.object(new Store(this).view(),"last").optString("id"))){new Store(this).undo();selected="";send();}});
   label(Words.get(v,v.optBoolean("issue")?"changed":v.optInt("pending")>0||v.optBoolean("cloudPending")?"pending":"ready"),11,0xff9eacc0);
   JSONArray tasks=Model.array(v,"tasks");if(tasks.length()>0){label("• • •",12,0xff64748b);for(int i=0;i<tasks.length();i++){JSONObject item=tasks.optJSONObject(i);int s=item.optInt("status");Button row=button((s==1?"✓  ":s==2?"–  ":"○  ")+item.optString("title"),0xff111820,()->{selected=item.optString("id");render(false);});row.setTextSize(12);row.setMaxLines(2);}}
   if(v.optBoolean("truncated"))label(Words.get(v,"more"),12,0xffa0acbe);
  }
  button("?  Saat bağlantısı",0xff111820,()->new AlertDialog.Builder(this).setTitle("Procats 1.7.2").setMessage("Telefonunda Procats 1.7.2 ve eşlenmiş saatte aynı sürüm olmalı. Kartlar menüsünden Procats’ı ekleyebilirsin. İşaretler önce cihazda saklanır; telefonda Procats açılınca hesabına aktarılır. Yenile düğmesi eşlenmiş telefonun son kaydını getirir.").setPositiveButton("Tamam",null).setNeutralButton("Yenile",(d,w)->Transport.refresh(this)).setNegativeButton("Bağlantıyı sıfırla",(d,w)->new AlertDialog.Builder(this).setTitle("Saat bağlantısını sıfırla?").setMessage("Bu saatteki önbellek ve henüz telefona gitmemiş işaretler silinir. Telefondaki planların korunur. Yalnız telefon değiştiyse veya bağlantıyı yeniden kurman gerekiyorsa kullan.").setNegativeButton("Vazgeç",null).setPositiveButton("Sıfırla",(dialog,which)->{new Store(this).erase();Transport.refresh(this);render(false);}).show()).show());
  scroll.post(()->scroll.scrollTo(0,keepScroll?y:0));
 }
 static class Progress extends View{
  final Paint p=new Paint(3);final int done,total,accent;Progress(Context c,int d,int t,int a){super(c);done=d;total=t;accent=a;setContentDescription(d+" / "+t);}
  @Override protected void onDraw(Canvas c){float w=getWidth(),h=getHeight();p.setStyle(Paint.Style.FILL);p.setColor(0xff202c3d);c.drawRoundRect(0,0,w,h,h/2,h/2,p);p.setColor(accent);c.drawRoundRect(0,0,total==0?0:w*done/total,h,h/2,h/2,p);}
 }
}
