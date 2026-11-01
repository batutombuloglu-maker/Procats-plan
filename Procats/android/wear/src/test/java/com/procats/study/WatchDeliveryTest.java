package com.procats.study;
import org.junit.*;import static org.junit.Assert.*;import org.junit.runner.RunWith;import org.robolectric.*;import org.robolectric.annotation.Config;import android.content.*;import com.procats.companion.*;import org.json.*;
@RunWith(RobolectricTestRunner.class) @Config(sdk=35)
public class WatchDeliveryTest {
 Context c;Store store;JSONObject snapshot;
 @Before public void setup()throws Exception{c=RuntimeEnvironment.getApplication();Shadows.shadowOf(c.getPackageManager()).setSystemFeature("android.hardware.type.watch",true);c.getSharedPreferences("procats_companion_v1",0).edit().clear().commit();store=new Store(c);snapshot=new JSONObject("{\"schema\":1,\"scope\":\"watch-account-0001\",\"sequence\":1,\"date\":\""+Model.today()+"\",\"total\":1,\"done\":0,\"tasks\":[{\"id\":\"10\",\"title\":\"Matematik\",\"identity\":\"a-b\",\"status\":0}]}");assertTrue(store.receive("paired-phone",snapshot));}
 @Test public void delayedOlderSnapshotCannotRollback(){assertFalse(store.receive("paired-phone",snapshot));assertEquals(1,store.view().optInt("total"));}
 @Test public void otherPhoneCannotInjectAccount()throws Exception{snapshot.put("sequence",100);assertFalse(store.receive("other-phone",snapshot));}
 @Test public void offlineActionSurvivesNewSnapshotUntilAck()throws Exception{assertTrue(store.act("10",1));snapshot.put("sequence",2);store.receive("paired-phone",snapshot);assertEquals(1,store.view().optInt("done"));assertEquals(1,Model.array(store.commands(),"operations").length());}
 @Test public void receiptClearsOutboxButPreservesProjectedPhoneResult()throws Exception{store.act("10",1);String id=Model.array(store.commands(),"operations").getJSONObject(0).getString("id");snapshot.put("sequence",2).put("done",1).put("seen",new JSONArray().put(id));snapshot.getJSONArray("tasks").getJSONObject(0).put("status",1);store.receive("paired-phone",snapshot);assertEquals(0,Model.array(store.commands(),"operations").length());assertEquals(1,store.view().optInt("done"));}
 @Test public void phoneLogoutClearsCachedTaskAndOfflineActions()throws Exception{store.act("10",1);assertTrue(store.receive("paired-phone",new JSONObject().put("sequence",2)));assertEquals(0,Model.array(store.view(),"tasks").length());assertEquals(0,Model.array(store.commands(),"operations").length());}
}
