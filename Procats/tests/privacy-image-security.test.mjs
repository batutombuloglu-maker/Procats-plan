import test from 'node:test';
import assert from 'node:assert/strict';
import {imageDimensions,readImageSize} from '../public/image-limits.js';

const png=(w,h)=>{const b=new Uint8Array(33);b.set([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82]);const v=new DataView(b.buffer);v.setUint32(16,w);v.setUint32(20,h);return b;};
const jpeg=(w,h)=>Uint8Array.from([255,216,255,224,0,4,0,0,255,192,0,8,8,h>>8,h&255,w>>8,w&255,1]);
const webp=(w,h,chunk='VP8X')=>{const b=new Uint8Array(chunk==='VP8X'?30:25),v=new DataView(b.buffer);b.set([...Buffer.from('RIFF')]);v.setUint32(4,b.length-8,true);b.set([...Buffer.from('WEBP'+chunk)],8);v.setUint32(16,chunk==='VP8X'?10:5,true);w--;h--;if(chunk==='VP8X'){b.set([w&255,w>>8&255,w>>16&255,h&255,h>>8&255,h>>16&255],24);}else b.set([47,w&255,(w>>8&63)|((h&3)<<6),h>>2&255,h>>10&15],20);return b;};
test('compressed PNG, JPEG and WebP dimensions are bounded before decoding',()=>{
 for(const [bytes,type] of [[png(1600,900),'image/png'],[jpeg(1600,900),'image/jpeg'],[webp(1600,900),'image/webp'],[webp(1600,900,'VP8L'),'image/webp']])assert.deepEqual(imageDimensions(bytes,type),{width:1600,height:900});
 for(const [bytes,type] of [[png(32000,32000),'image/png'],[jpeg(10000,10000),'image/jpeg'],[webp(20000,20000),'image/webp'],[png(0,800),'image/png'],[jpeg(1,0),'image/jpeg'],[png(1200,800),'image/jpeg'],[Uint8Array.from([255,216,255,218]),'image/jpeg']])assert.throws(()=>imageDimensions(bytes,type),/invalid/);
});
test('large valid WebP bitstreams need only their header, while unknown or truncated chunks fail closed',()=>{
 const b=new Uint8Array(30),v=new DataView(b.buffer);b.set(Buffer.from('RIFF'));v.setUint32(4,2000022,true);b.set(Buffer.from('WEBPVP8 '),8);v.setUint32(16,2000000,true);b.set([0,0,0,157,1,42,64,6,132,3],20);assert.deepEqual(imageDimensions(b,'image/webp'),{width:1600,height:900});
 b.set(Buffer.from('JUNK'),12);assert.throws(()=>imageDimensions(b,'image/webp'),/invalid/);
 assert.throws(()=>imageDimensions(webp(2,2).slice(0,27),'image/webp'),/invalid/);
});
test('file preflight reads at most one MiB and rejects oversized uploads before reading',async()=>{
 let reads=0;const file={type:'image/png',size:15000000,slice(start,end){assert.equal(start,0);assert.equal(end,1048576);return {arrayBuffer:async()=>{reads++;return png(1600,900).buffer;}};}};
 assert.deepEqual(await readImageSize(file),{width:1600,height:900});assert.equal(reads,1);
 await assert.rejects(readImageSize({...file,size:16*1024*1024}),/invalid/);assert.equal(reads,1);
});
