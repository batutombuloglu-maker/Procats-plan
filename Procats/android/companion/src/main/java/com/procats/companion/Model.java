package com.procats.companion;

import org.json.*;
import java.util.*;
import java.time.LocalDate;

/** Pure, bounded protocol. An explicit expected state makes repeated taps safe. */
public final class Model {
 public static final int MAX_QUEUE=200;
 public static JSONObject copy(JSONObject v){try{return new JSONObject(v.toString());}catch(JSONException e){throw new IllegalArgumentException(e);}}
 public static JSONArray array(JSONObject o,String k){JSONArray a=o.optJSONArray(k);return a==null?new JSONArray():a;}
 public static JSONObject object(JSONObject o,String k){JSONObject v=o.optJSONObject(k);return v==null?new JSONObject():v;}
 public static void put(JSONObject o,String k,Object v){try{o.put(k,v);}catch(JSONException e){throw new IllegalArgumentException(e);}}
 public static String today(){return LocalDate.now().toString();}
 public static JSONObject find(JSONObject snapshot,String id){JSONArray ts=array(snapshot,"tasks");for(int i=0;i<ts.length();i++){JSONObject t=ts.optJSONObject(i);if(t!=null&&id.equals(t.optString("id")))return t;}return null;}
 public static boolean contains(JSONArray values,String id){for(int i=0;i<values.length();i++)if(id.equals(values.optString(i)))return true;return false;}
 public static JSONArray tail(JSONArray a,int limit){JSONArray b=new JSONArray();for(int i=Math.max(0,a.length()-limit);i<a.length();i++)b.put(a.opt(i));return b;}
 public static boolean validOperation(JSONObject o){
  return o!=null&&o.optString("id").matches("[-a-zA-Z0-9]{16,80}")&&o.optString("scope").length()>=16&&o.optString("scope").length()<=80
   &&o.optString("task").matches("[0-9.Ee+\\-]{1,40}")&&o.optString("date").matches("\\d{4}-\\d{2}-\\d{2}")
   &&o.optString("identity").matches("[a-f0-9]{1,8}-[a-f0-9]{1,8}")&&o.optInt("before",-1)>=0&&o.optInt("before",-1)<=2
   &&o.optInt("after",-1)>=0&&o.optInt("after",-1)<=2;
 }
 public static void validateSnapshot(JSONObject s){
  if(s.optInt("schema")!=1||!s.optString("date").matches("\\d{4}-\\d{2}-\\d{2}")||array(s,"tasks").length()>100||s.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8).length>95000)throw new IllegalArgumentException("Invalid snapshot");
  Set<String> ids=new HashSet<>();JSONArray a=array(s,"tasks");
  for(int i=0;i<a.length();i++){JSONObject t=a.optJSONObject(i);if(t==null||!ids.add(t.optString("id"))||t.optString("title").length()>180||t.optString("desc").length()>240||t.optInt("status",-1)<0||t.optInt("status",-1)>2)throw new IllegalArgumentException("Invalid task");}
 }
 public static JSONObject project(JSONObject snapshot,JSONArray operations){
  JSONObject s=copy(snapshot);int done=s.optInt("done"),missed=s.optInt("missed");
  for(int i=0;i<operations.length();i++){
   JSONObject op=operations.optJSONObject(i);if(!validOperation(op)||!s.optString("date").equals(op.optString("date")))continue;
   JSONObject t=find(s,op.optString("task"));if(t==null||!t.optString("identity").equals(op.optString("identity"))||t.optInt("status")!=op.optInt("before"))continue;
   int before=t.optInt("status"),after=op.optInt("after");done+=(after==1?1:0)-(before==1?1:0);missed+=(after==2?1:0)-(before==2?1:0);put(t,"status",after);
  }
  put(s,"done",done);put(s,"missed",missed);return s;
 }
 public static JSONObject next(JSONObject s){JSONArray a=array(s,"tasks");for(int i=0;i<a.length();i++){JSONObject t=a.optJSONObject(i);if(t!=null&&t.optInt("status")==0)return t;}return null;}
 public static JSONObject operation(JSONObject view,String task,int after){
  if(!today().equals(view.optString("date"))||view.optString("scope").isEmpty())return null;
  JSONObject t=find(view,task);if(t==null||after<0||after>2||after==t.optInt("status"))return null;
  JSONObject op=new JSONObject();put(op,"id",UUID.randomUUID().toString());put(op,"scope",view.optString("scope"));put(op,"date",view.optString("date"));put(op,"task",task);
  put(op,"identity",t.optString("identity"));put(op,"before",t.optInt("status"));put(op,"after",after);return op;
 }
 public static boolean undoable(JSONObject view,JSONObject last){JSONObject t=find(view,last.optString("task"));return today().equals(view.optString("date"))&&last.optInt("before",-1)==0&&last.optInt("after",0)>0&&t!=null&&t.optInt("status")==last.optInt("after")&&t.optString("identity").equals(last.optString("identity"));}
 private Model(){}
}
