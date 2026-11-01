/* HTTPS in production; loopback HTTP is restricted to local development. */
(()=>{if(location.protocol==='http:'&&!['localhost','127.0.0.1','[::1]'].includes(location.hostname)){const url=new URL(location.href);url.protocol='https:';location.replace(url.href);}})();
