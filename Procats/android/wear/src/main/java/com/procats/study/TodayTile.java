package com.procats.study;
import androidx.wear.tiles.TileService;
import androidx.wear.tiles.TileBuilders;
import androidx.wear.tiles.RequestBuilders;
import androidx.wear.protolayout.*;
import com.google.common.util.concurrent.*;
import com.procats.companion.*;
import org.json.*;
import android.graphics.Color;
import static androidx.wear.protolayout.DimensionBuilders.*;

public class TodayTile extends TileService {
 private int accent=0xff309aff;
 private LayoutElementBuilders.Text text(String s,float size,int color,int lines){return new LayoutElementBuilders.Text.Builder().setText(s).setMaxLines(lines).setMultilineAlignment(LayoutElementBuilders.TEXT_ALIGN_CENTER).setFontStyle(new LayoutElementBuilders.FontStyle.Builder().setSize(sp(size)).setColor(ColorBuilders.argb(color)).build()).build();}
 private LayoutElementBuilders.Box button(String label,String id,int bg){
  return new LayoutElementBuilders.Box.Builder().setWidth(dp(68)).setHeight(dp(48)).setModifiers(new ModifiersBuilders.Modifiers.Builder()
   .setBackground(new ModifiersBuilders.Background.Builder().setColor(ColorBuilders.argb(bg)).setCorner(new ModifiersBuilders.Corner.Builder().setRadius(dp(21)).build()).build())
   .setSemantics(new ModifiersBuilders.Semantics.Builder().setContentDescription(label).build())
   .setClickable(new ModifiersBuilders.Clickable.Builder().setId(id).setOnClick(new ActionBuilders.LoadAction.Builder().build()).build()).build())
   .addContent(text(label,11,Color.WHITE,2)).build();
 }
 private void action(String click){
  if(click==null||click.isEmpty())return;Store store=new Store(this);JSONObject view=store.view();String[] p=click.split(":",-1);
  if(p.length==6&&p[1].equals(view.optString("scope"))&&p[4].equals(view.optString("date"))&&Model.today().equals(p[4])){
   if(p[0].equals("undo")){if(p[5].equals(Model.object(view,"last").optString("id")))store.undo();}
   else if(p[0].equals("done")||p[0].equals("missed")){JSONObject t=Model.find(view,p[2]);if(t!=null&&t.optInt("status")==0&&t.optString("identity").equals(p[3]))store.act(p[2],p[0].equals("done")?1:2);}
   Transport.send(this);
  }
 }
 @Override protected ListenableFuture<TileBuilders.Tile> onTileRequest(RequestBuilders.TileRequest request){
  action(request.getCurrentState().getLastClickableId());JSONObject v=new Store(this).view(),t=Model.next(v);try{accent=Color.parseColor(Model.object(v,"colors").optString("accent","#309aff"));}catch(Exception ignored){}
  LayoutElementBuilders.Column.Builder column=new LayoutElementBuilders.Column.Builder().setWidth(expand()).setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER);
  column.addContent(text("PROCATS  ·  "+Words.get(v,"today"),11,accent,1));
  boolean locked=v.optString("scope").isEmpty(),stale=!Model.today().equals(v.optString("date"));
  if(locked||stale){column.addContent(text(Words.get(v,locked?"locked":"stale"),16,Color.WHITE,3));column.addContent(text(Words.get(v,"lockedHelp"),12,0xffaeb7c4,3));}
  else{
   column.addContent(text(v.optInt("done")+" / "+v.optInt("total"),13,0xffacb9cb,1));
   column.addContent(text(t!=null?t.optString("title"):Words.get(v,v.optInt("total")==0?"empty":"finished"),17,Color.WHITE,2));
   if(t!=null){String suffix=":"+v.optString("scope")+":"+t.optString("id")+":"+t.optString("identity")+":"+v.optString("date")+":";
    column.addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(dp(6)).build());column.addContent(new LayoutElementBuilders.Row.Builder().addContent(button("✓ "+Words.get(v,"done"),"done"+suffix,0xff135994)).addContent(new LayoutElementBuilders.Spacer.Builder().setWidth(dp(6)).build()).addContent(button("– "+Words.get(v,"missed"),"missed"+suffix,0xff232b37)).build());
   }
   column.addContent(text(v.optInt("pending")>0?"• "+Words.get(v,"pending"):Words.get(v,"open"),10,0xffaeb7c4,2));
  }
  // Whole tile opens the task app; actions override this on their own hit targets.
  ModifiersBuilders.Modifiers mods=new ModifiersBuilders.Modifiers.Builder().setPadding(new ModifiersBuilders.Padding.Builder().setStart(dp(24)).setEnd(dp(24)).setTop(dp(20)).setBottom(dp(20)).build())
   .setClickable(new ModifiersBuilders.Clickable.Builder().setId("open").setOnClick(new ActionBuilders.LaunchAction.Builder().setAndroidActivity(new ActionBuilders.AndroidActivity.Builder().setPackageName(getPackageName()).setClassName(WatchActivity.class.getName()).build()).build()).build()).build();
  LayoutElementBuilders.Box root=new LayoutElementBuilders.Box.Builder().setWidth(expand()).setHeight(expand()).setModifiers(mods).addContent(column.build()).build();
  return Futures.immediateFuture(new TileBuilders.Tile.Builder().setResourcesVersion("1").setFreshnessIntervalMillis(30*60*1000).setTileTimeline(new TimelineBuilders.Timeline.Builder().addTimelineEntry(new TimelineBuilders.TimelineEntry.Builder().setLayout(new LayoutElementBuilders.Layout.Builder().setRoot(root).build()).build()).build()).build());
 }
 @Override protected ListenableFuture<ResourceBuilders.Resources> onTileResourcesRequest(RequestBuilders.ResourcesRequest request){return Futures.immediateFuture(new ResourceBuilders.Resources.Builder().setVersion("1").build());}
}
