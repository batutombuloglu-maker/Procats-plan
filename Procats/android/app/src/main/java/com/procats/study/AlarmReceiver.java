package com.procats.study;
import android.content.*;
public class AlarmReceiver extends BroadcastReceiver {
 @Override public void onReceive(Context c,Intent i){String action=i.getAction();if(AlarmState.STOP.equals(action)){AlarmState.stop(c);return;}long end=AlarmState.prefs(c).getLong("end",0);if(end<=0||AlarmState.prefs(c).getBoolean("dismissed",false))return;long remaining=AlarmState.remaining(c);if(AlarmState.FIRE.equals(action)){if(i.getLongExtra("end",0)!=end)return;if(remaining>1000){AlarmState.schedule(c);return;}AlarmState.deliver(c);}else if(remaining>0)AlarmState.schedule(c);else if(remaining>-300000)AlarmState.deliver(c);else AlarmState.stop(c);}
}
