package com.procats.study;

import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.net.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;
import java.util.concurrent.ExecutorService;
import org.json.JSONObject;
import android.net.Uri;

@CapacitorPlugin(name="ProcatsResources")
public class ProcatsResourcesPlugin extends Plugin {
 private final ExecutorService worker=Executors.newSingleThreadExecutor();
 @PluginMethod public void pendingShare(PluginCall call){call.resolve(((MainActivity)getActivity()).resourceShare());}
 @PluginMethod public void acknowledgeShare(PluginCall call){((MainActivity)getActivity()).acknowledgeResourceShare(call.getString("id",""));call.resolve();}
 @PluginMethod public void metadata(PluginCall call){
  String value=call.getString("url","");Uri u=Uri.parse(value);String host=u.getHost(),id=null,canonical=null;
  if("https".equals(u.getScheme())&&"www.youtube.com".equals(host)&&u.getUserInfo()==null&&u.getPort()==-1){
   if("/playlist".equals(u.getPath())){id=u.getQueryParameter("list");if(id!=null&&id.matches("[A-Za-z0-9_-]{10,150}"))canonical="https://www.youtube.com/playlist?list="+id;}
   if("/watch".equals(u.getPath())){id=u.getQueryParameter("v");if(id!=null&&id.matches("[A-Za-z0-9_-]{11}"))canonical="https://www.youtube.com/watch?v="+id;}
  }
  if(canonical==null){call.reject("Unsupported resource");return;}
  final String resource=canonical;
  worker.execute(()->{
   HttpURLConnection connection=null;
   try{
    URL endpoint=new URL("https://www.youtube.com/oembed?format=json&url="+URLEncoder.encode(resource,StandardCharsets.UTF_8.name()));
    connection=(HttpURLConnection)endpoint.openConnection();connection.setConnectTimeout(6500);connection.setReadTimeout(6500);connection.setInstanceFollowRedirects(false);connection.setRequestProperty("Accept","application/json");
    if(connection.getResponseCode()!=200)throw new IOException("Metadata unavailable");
    ByteArrayOutputStream bytes=new ByteArrayOutputStream();try(InputStream stream=connection.getInputStream()){byte[] buffer=new byte[2048];int n;while((n=stream.read(buffer))!=-1){if(bytes.size()+n>65536)throw new IOException("Response too large");bytes.write(buffer,0,n);}}
    JSONObject json=new JSONObject(bytes.toString(StandardCharsets.UTF_8.name()));JSObject result=new JSObject();
    result.put("title",shortText(json.optString("title"),180));result.put("author",shortText(json.optString("author_name"),120));
    Uri image=Uri.parse(json.optString("thumbnail_url"));if("https".equals(image.getScheme())&&"i.ytimg.com".equals(image.getHost())&&image.getUserInfo()==null&&image.getPort()==-1)result.put("thumbnail",image.toString());
    call.resolve(result);
   }catch(Exception error){call.reject("Metadata unavailable");}finally{if(connection!=null)connection.disconnect();}
  });
 }
 private String shortText(String text,int max){return text.substring(0,Math.min(max,text.length()));}
 @Override protected void handleOnDestroy(){worker.shutdownNow();}
}
