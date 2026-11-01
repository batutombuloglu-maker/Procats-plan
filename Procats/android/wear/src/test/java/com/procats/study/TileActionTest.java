package com.procats.study;
import org.junit.*;import static org.junit.Assert.*;import org.junit.runner.RunWith;
import org.robolectric.*;import org.robolectric.annotation.Config;import android.content.*;import com.procats.companion.*;import org.json.*;import java.lang.reflect.Method;
@RunWith(RobolectricTestRunner.class) @Config(sdk=35)
public class TileActionTest {
 Store store;TodayTile tile;Method action;String suffix;
 @Before public void setup()throws Exception{Context c=RuntimeEnvironment.getApplication();Shadows.shadowOf(c.getPackageManager()).setSystemFeature("android.hardware.type.watch",true);c.getSharedPreferences("procats_companion_v1",0).edit().clear().commit();store=new Store(c);store.receive("phone",new JSONObject("{\"schema\":1,\"scope\":\"tile-account-00001\",\"sequence\":1,\"date\":\""+Model.today()+"\",\"done\":0,\"total\":2,\"tasks\":[{\"id\":\"10\",\"identity\":\"a-b\",\"title\":\"Matematik\",\"status\":0},{\"id\":\"11\",\"identity\":\"c-d\",\"title\":\"Paragraf\",\"status\":0}]}"));tile=Robolectric.buildService(TodayTile.class).create().get();action=TodayTile.class.getDeclaredMethod("action",String.class);action.setAccessible(true);suffix=":tile-account-00001:10:a-b:"+Model.today()+":";}
 @Test public void doneAdvancesAndRepeatedStaleTapDoesNotCompleteNextTask()throws Exception{action.invoke(tile,"done"+suffix);action.invoke(tile,"done"+suffix);assertEquals("11",Model.next(store.view()).optString("id"));assertEquals(1,Model.array(store.commands(),"operations").length());}
 @Test public void missedAdvancesWithoutIncreasingDone()throws Exception{action.invoke(tile,"missed"+suffix);assertEquals("11",Model.next(store.view()).optString("id"));assertEquals(0,store.view().optInt("done"));assertEquals(1,store.view().optInt("missed"));}
 @Test public void oldAccountUnknownActionAndAlteredTaskAreIgnored()throws Exception{action.invoke(tile,"done"+suffix.replace("tile-account-00001","other-account-001"));action.invoke(tile,"delete"+suffix);action.invoke(tile,"done"+suffix.replace("a-b","a-c"));assertEquals(0,Model.array(store.commands(),"operations").length());}
}
