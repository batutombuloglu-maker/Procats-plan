package com.procats.companion;
import android.content.Context;
import com.google.android.gms.wearable.*;
import com.google.android.gms.tasks.Task;
import org.json.*;
import java.util.concurrent.*;

public final class Transport {
 public static final String STATE="/procats/v1/state",COMMANDS="/procats/v1/commands",REQUEST="/procats/v1/request";
 public static Task<DataItem> send(Context c){Store store=new Store(c);JSONObject data=store.watch?store.commands():store.view();if(!store.watch&&!store.wearEnabled()){JSONObject locked=new JSONObject();Model.put(locked,"sequence",data.optLong("sequence"));data=locked;}PutDataMapRequest put=PutDataMapRequest.create(store.watch?COMMANDS:STATE);put.getDataMap().putString("json",data.toString());return Wearable.getDataClient(c).putDataItem(put.asPutDataRequest().setUrgent());}
 public static void refresh(Context c){
  Wearable.getDataClient(c).getDataItems().addOnSuccessListener(items->{try{for(DataItem item:items)handle(c,item);}finally{items.release();}});
  Wearable.getNodeClient(c).getConnectedNodes().addOnSuccessListener(nodes->{for(Node node:nodes)Wearable.getMessageClient(c).sendMessage(node.getId(),REQUEST,new byte[0]);});
 }
 public static boolean handle(Context c,DataItem item){
  try{
   String path=item.getUri().getPath();Store store=new Store(c);
   if(!(store.watch?STATE:COMMANDS).equals(path))return false;
   String raw=DataMapItem.fromDataItem(item).getDataMap().getString("json");if(raw==null||raw.length()>95000)return false;
   JSONObject body=new JSONObject(raw);
   if(store.watch)return store.receive(item.getUri().getHost(),body);
   JSONArray operations=Model.array(body,"operations");if(operations.length()>Model.MAX_QUEUE)return false;
   for(int i=0;i<operations.length();i++)store.accept(operations.optJSONObject(i),true);
   send(c);return true;
  }catch(Exception ignored){return false;}
 }
 private Transport(){}
}
