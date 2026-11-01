// Inspect bounded compressed headers before allocating a decoded image surface.
// This is a size guard, not a replacement for the browser's image decoder.
const MAX_HEADER_BYTES=1024*1024,MAX_FILE_BYTES=15*1024*1024,MAX_PIXELS=40000000;
const invalid=()=>{throw Error('invalid');};
export function imageDimensions(bytes,type){
 const b=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes),n=b.length;
 const be16=i=>(b[i]<<8)|b[i+1],be32=i=>(b[i]*0x1000000+(b[i+1]<<16)+(b[i+2]<<8)+b[i+3]),le24=i=>b[i]+(b[i+1]<<8)+(b[i+2]<<16),le32=i=>b[i]+b[i+1]*256+b[i+2]*65536+b[i+3]*16777216;
 const ascii=(i,s)=>i+s.length<=n&&[...s].every((c,j)=>b[i+j]===c.charCodeAt(0));let width,height;
 if(type==='image/png'){
  if(n<33||![137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v)||be32(8)!==13||!ascii(12,'IHDR'))invalid();width=be32(16);height=be32(20);
 }else if(type==='image/jpeg'){
  if(n<4||b[0]!==255||b[1]!==216)invalid();let i=2;
  while(i<n){if(b[i++]!==255)invalid();while(i<n&&b[i]===255)i++;if(i>=n)invalid();const marker=b[i++];if(marker===217||marker===218)invalid();if(marker===216||marker===1||(marker>=208&&marker<=215))continue;if(i+2>n)invalid();const length=be16(i);if(length<2||i+length>n)invalid();if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){if(length<8)invalid();height=be16(i+3);width=be16(i+5);break;}i+=length;}
 }else if(type==='image/webp'){
  if(n<20||!ascii(0,'RIFF')||!ascii(8,'WEBP'))invalid();let i=12;
  while(i+8<=n){const length=le32(i+4),start=i+8;
   if(ascii(i,'VP8X')){if(length!==10||start+10>n)invalid();width=le24(start+4)+1;height=le24(start+7)+1;break;}
   if(ascii(i,'VP8 ')){if(length<10||start+10>n||b[start]&1||b[start+3]!==157||b[start+4]!==1||b[start+5]!==42)invalid();width=(b[start+6]+b[start+7]*256)&16383;height=(b[start+8]+b[start+9]*256)&16383;break;}
   if(ascii(i,'VP8L')){if(length<5||start+5>n||b[start]!==47)invalid();width=1+b[start+1]+((b[start+2]&63)<<8);height=1+(b[start+2]>>6)+(b[start+3]<<2)+((b[start+4]&15)<<10);break;}if(start+length>n)invalid();i=start+length+(length%2);}
 }else invalid();
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||width*height>MAX_PIXELS)invalid();return {width,height};
}
export async function readImageSize(file){
 if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size<1||file.size>MAX_FILE_BYTES)invalid();
 return imageDimensions(new Uint8Array(await file.slice(0,MAX_HEADER_BYTES).arrayBuffer()),file.type);
}
