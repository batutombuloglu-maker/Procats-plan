// PNG already compresses its pixels; store entries without a second compression pass.
const table=Uint32Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
const crc=bytes=>{let n=0xffffffff;for(const b of bytes)n=table[(n^b)&255]^(n>>>8);return (n^0xffffffff)>>>0;};
export async function zipImages(files){
 const parts=[],directory=[];let offset=0,dirSize=0;
 for(const {name,blob}of files){
  if(/[\\/]|\.\./.test(name))throw Error('Invalid archive name');
  const label=new TextEncoder().encode(name),bytes=new Uint8Array(await blob.arrayBuffer()),checksum=crc(bytes),head=new Uint8Array(30+label.length),h=new DataView(head.buffer);
  h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint32(14,checksum,true);h.setUint32(18,bytes.length,true);h.setUint32(22,bytes.length,true);h.setUint16(26,label.length,true);head.set(label,30);parts.push(head,bytes);
  const entry=new Uint8Array(46+label.length),d=new DataView(entry.buffer);d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x800,true);d.setUint32(16,checksum,true);d.setUint32(20,bytes.length,true);d.setUint32(24,bytes.length,true);d.setUint16(28,label.length,true);d.setUint32(42,offset,true);entry.set(label,46);directory.push(entry);dirSize+=entry.length;offset+=head.length+bytes.length;
 }
 const end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,dirSize,true);e.setUint32(16,offset,true);
 return new Blob([...parts,...directory,end],{type:'application/zip'});
}
