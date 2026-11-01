package com.procats.companion;

import android.content.*;
import android.content.pm.PackageManager;
import org.json.*;
import java.util.*;

/** Private, durable device journal. No Firebase credentials are copied to wearables. */
public final class Store {
 public static final String CHANGED="com.procats.companion.CHANGED";
 private static final Object LOCK=new Object();
 private final Context context;private final SharedPreferences prefs;public final boolean watch;
 public Store(Context c){context=c.getApplicationContext();prefs=context.getSharedPreferences("procats_companion_v1",0);watch=context.getPackageManager().hasSystemFeature(PackageManager.FEATURE_WATCH);}
 private JSONObject read(){try{return new JSONObject(prefs.getString("journal","{}"));}catch(JSONException e){return new JSONObject();}}
 private void write(JSONObject state){write(state,prefs.edit());}
 private void write(JSONObject state,SharedPreferences.Editor edit){Model.put(state,"sequence",state.optLong("sequence")+1);if(!edit.putString("journal",state.toString()).commit())throw new IllegalStateException("Device storage unavailable");}
 public String bind(String account){synchronized(LOCK){
  if(!account.matches("[a-f0-9]{64}"))throw new IllegalArgumentException("Account");JSONObject s=read();
  if(!account.equals(s.optString("account"))){
   SharedPreferences.Editor edit=prefs.edit();
   if(!s.optString("account").isEmpty())edit.putString("held_"+s.optString("account"),Model.array(s,"queue").toString());
   JSONArray pending;try{pending=new JSONArray(prefs.getString("held_"+account,"[]"));}catch(JSONException e){pending=new JSONArray();}
   long seq=s.optLong("sequence");s=new JSONObject();Model.put(s,"sequence",seq);Model.put(s,"account",account);Model.put(s,"scope",UUID.randomUUID().toString());
   for(int i=0;i<pending.length();i++)Model.put(pending.optJSONObject(i),"scope",s.optString("scope"));Model.put(s,"queue",pending);
   edit.remove("held_"+account);write(s,edit);
  }
  return s.optString("scope");
 }}
 public void lock(){synchronized(LOCK){JSONObject old=read();SharedPreferences.Editor edit=prefs.edit();if(!old.optString("account").isEmpty())edit.putString("held_"+old.optString("account"),Model.array(old,"queue").toString());JSONObject s=new JSONObject();Model.put(s,"sequence",old.optLong("sequence"));write(s,edit);}changed();}
 public void erase(){synchronized(LOCK){long seq=read().optLong("sequence");if(!prefs.edit().clear().commit())throw new IllegalStateException("Storage");JSONObject s=new JSONObject();Model.put(s,"sequence",seq);write(s);}changed();}
 public void eraseAccount(String account){synchronized(LOCK){if(!account.matches("[a-f0-9]{64}"))throw new IllegalArgumentException("Account");if(!prefs.edit().remove("held_"+account).commit())throw new IllegalStateException("Storage");JSONObject current=read();if(account.equals(current.optString("account"))){JSONObject empty=new JSONObject();Model.put(empty,"sequence",current.optLong("sequence"));write(empty);}}changed();}
 public JSONObject pending(){synchronized(LOCK){JSONObject s=read(),out=new JSONObject();Model.put(out,"scope",s.optString("scope"));Model.put(out,"operations",Model.array(s,"queue"));return out;}}
 public boolean wearEnabled(){synchronized(LOCK){return read().optBoolean("wearEnabled");}}
 public void enableWear(boolean enabled){synchronized(LOCK){JSONObject s=read();if(s.optString("scope").isEmpty())throw new IllegalStateException("Sign in first");Model.put(s,"wearEnabled",enabled);if(!enabled){String scope=UUID.randomUUID().toString();Model.put(s,"scope",scope);JSONArray q=Model.array(s,"queue");for(int i=0;i<q.length();i++)Model.put(q.optJSONObject(i),"scope",scope);Model.put(s,"last",new JSONObject());}write(s);}changed();}
 public void publish(String scope,JSONObject snapshot,JSONArray results){synchronized(LOCK){
  Model.validateSnapshot(snapshot);JSONObject s=read();if(!scope.equals(s.optString("scope")))throw new IllegalStateException("Account changed");
  Set<String> ack=new HashSet<>();for(int i=0;i<results.length();i++){JSONObject r=results.optJSONObject(i);if(r!=null){ack.add(r.optString("id"));if(!"applied".equals(r.optString("result")))Model.put(s,"issue",true);}}
  JSONArray keep=new JSONArray(),q=Model.array(s,"queue");for(int i=0;i<q.length();i++)if(!ack.contains(q.optJSONObject(i).optString("id")))keep.put(q.opt(i));
  Model.put(s,"queue",keep);Model.put(s,"snapshot",snapshot);write(s);
 }changed();}
 public JSONObject view(){synchronized(LOCK){JSONObject s=read();JSONObject v=Model.project(Model.object(s,"snapshot"),Model.array(s,watch?"outbox":"queue"));
  Model.put(v,"scope",s.optString("scope"));Model.put(v,"sequence",s.optLong("sequence"));Model.put(v,"pending",Model.array(s,watch?"outbox":"queue").length()+ (watch?Model.object(s,"snapshot").optInt("pending"):0));
  Model.put(v,"issue",s.optBoolean("issue"));Model.put(v,"last",Model.object(s,"last"));Model.put(v,"seen",Model.array(s,"seen"));return v;
 }}
 public boolean act(String task,int after){JSONObject op=Model.operation(view(),task,after);if(op==null)return false;return accept(op,false);}
 public boolean undo(){JSONObject v=view(),last=Model.object(v,"last");return Model.undoable(v,last)&&act(last.optString("task"),0);}
 public boolean accept(JSONObject op,boolean remote){synchronized(LOCK){
  JSONObject s=read();if(remote&&!s.optBoolean("wearEnabled"))return false;if(!Model.validOperation(op)||!op.optString("scope").equals(s.optString("scope")))return false;
  JSONArray seen=Model.array(s,"seen");if(Model.contains(seen,op.optString("id")))return true;
  String key=watch?"outbox":"queue";JSONArray q=Model.array(s,key);for(int i=0;i<q.length();i++)if(op.optString("id").equals(q.optJSONObject(i).optString("id")))return true;
  if(q.length()>=Model.MAX_QUEUE)return false;
  JSONObject v=view(),t=Model.find(v,op.optString("task"));
  // A delayed watch action can refer to yesterday or a task outside the capped
  // snapshot. Keep it durably; the phone workspace checks the full task history
  // before committing it. Never optimistically change a different task/day.
  boolean matches=t!=null&&op.optString("date").equals(v.optString("date"))&&t.optString("identity").equals(op.optString("identity"))&&t.optInt("status")==op.optInt("before");
  if(!matches&&!remote)return false;
  q.put(Model.copy(op));Model.put(s,key,q);if(matches)Model.put(s,"last",op);
  if(!watch){seen.put(op.optString("id"));Model.put(s,"seen",Model.tail(seen,600));}write(s);
 }changed();return true;}
 public JSONObject commands(){synchronized(LOCK){JSONObject s=read(),o=new JSONObject();Model.put(o,"scope",s.optString("scope"));Model.put(o,"operations",Model.array(s,"outbox"));return o;}}
 public boolean receive(String node,JSONObject remote){synchronized(LOCK){
  if(!watch||remote.toString().length()>95000)return false;JSONObject s=read();String owner=s.optString("owner");
  if(!owner.isEmpty()&&!owner.equals(node))return false;
  if(owner.equals(node)&&remote.optLong("sequence")<=s.optLong("remoteSequence",-1))return false;
  String scope=remote.optString("scope");if(!scope.isEmpty())Model.validateSnapshot(remote);
  JSONArray outbox=Model.array(s,"outbox"),keep=new JSONArray(),seen=Model.array(remote,"seen");
  if(scope.equals(s.optString("scope"))){for(int i=0;i<outbox.length();i++)if(!Model.contains(seen,outbox.optJSONObject(i).optString("id")))keep.put(outbox.opt(i));}
  Model.put(s,"owner",node);Model.put(s,"remoteSequence",remote.optLong("sequence"));Model.put(s,"scope",scope);Model.put(s,"snapshot",remote);Model.put(s,"outbox",keep);
  Model.put(s,"issue",remote.optBoolean("issue"));if(keep.length()==0)Model.put(s,"last",Model.object(remote,"last"));write(s);
 }changed();return true;}
 public void changed(){context.sendBroadcast(new Intent(CHANGED).setPackage(context.getPackageName()));}
}
