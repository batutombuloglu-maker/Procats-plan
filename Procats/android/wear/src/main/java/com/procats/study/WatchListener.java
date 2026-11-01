package com.procats.study;
import com.procats.companion.*;
import com.google.android.gms.wearable.*;
import androidx.wear.tiles.TileService;
public class WatchListener extends WearableListenerService {
 @Override public void onDataChanged(DataEventBuffer events){for(DataEvent e:events)if(e.getType()==DataEvent.TYPE_CHANGED&&Transport.handle(this,e.getDataItem()))TileService.getUpdater(this).requestUpdate(TodayTile.class);}
 @Override public void onMessageReceived(MessageEvent e){if(Transport.REQUEST.equals(e.getPath()))Transport.send(this);}
}
