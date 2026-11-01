package com.procats.study;
import com.procats.companion.*;
import com.google.android.gms.wearable.*;
public class PhoneWearService extends WearableListenerService {
 @Override public void onDataChanged(DataEventBuffer events){for(DataEvent e:events)if(e.getType()==DataEvent.TYPE_CHANGED&&Transport.handle(this,e.getDataItem()))ProcatsWidget.updateAll(this);}
 @Override public void onMessageReceived(MessageEvent e){if(Transport.REQUEST.equals(e.getPath()))Transport.send(this);}
}
