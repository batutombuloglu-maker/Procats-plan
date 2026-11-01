package com.procats.companion;
import org.junit.Test;import static org.junit.Assert.*;import org.json.*;
public class ModelTest {
 JSONObject snapshot() throws Exception{return new JSONObject("{\"schema\":1,\"scope\":\"sample-scope-0001\",\"date\":\""+Model.today()+"\",\"done\":0,\"missed\":0,\"total\":2,\"tasks\":[{\"id\":\"10\",\"identity\":\"a-b\",\"title\":\"Matematik\",\"status\":0},{\"id\":\"11\",\"identity\":\"c-d\",\"title\":\"Türkçe\",\"status\":0}]}");}
 @Test public void nextTaskAdvances()throws Exception{JSONObject s=snapshot(),op=Model.operation(s,"10",1);JSONObject next=Model.project(s,new JSONArray().put(op));assertEquals("11",Model.next(next).optString("id"));assertEquals(1,next.optInt("done"));assertEquals(0,s.optInt("done"));}
 @Test public void missedAdvancesWithoutCompletion()throws Exception{JSONObject s=snapshot(),v=Model.project(s,new JSONArray().put(Model.operation(s,"10",2)));assertEquals(0,v.optInt("done"));assertEquals(1,v.optInt("missed"));assertEquals("11",Model.next(v).optString("id"));}
 @Test public void duplicateDoesNotDoubleCount()throws Exception{JSONObject s=snapshot(),op=Model.operation(s,"10",1);assertEquals(1,Model.project(s,new JSONArray().put(op).put(op)).optInt("done"));}
 @Test public void staleDateCannotAct()throws Exception{JSONObject s=snapshot();s.put("date","2026-01-01");assertNull(Model.operation(s,"10",1));}
 @Test public void staleIdentityCannotProject()throws Exception{JSONObject s=snapshot(),op=Model.operation(s,"10",1);op.put("identity","b-c");assertEquals(0,Model.project(s,new JSONArray().put(op)).optInt("done"));}
 @Test public void undoIsOnlyLastMatchingAction()throws Exception{JSONObject s=snapshot(),op=Model.operation(s,"10",1),v=Model.project(s,new JSONArray().put(op));assertTrue(Model.undoable(v,op));JSONObject undo=Model.operation(v,"10",0);assertEquals(0,Model.project(v,new JSONArray().put(undo)).optInt("done"));}
 @Test public void cappedSnapshotRejectsHugePayload()throws Exception{JSONObject s=snapshot();JSONArray a=s.getJSONArray("tasks");for(int i=0;i<100;i++)a.put(new JSONObject("{\"id\":\""+(i+100)+"\",\"title\":\"x\",\"status\":0}"));assertThrows(IllegalArgumentException.class,()->Model.validateSnapshot(s));}
 @Test public void invalidActionIsRejected()throws Exception{JSONObject s=snapshot();assertNull(Model.operation(s,"10",9));assertNull(Model.operation(s,"missing",1));assertFalse(Model.validOperation(new JSONObject()));}
}
