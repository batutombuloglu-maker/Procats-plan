import {PDFDocument,rgb} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
function color(v){const x=v.replace('#',''),h=x.length===3?x.split('').map(c=>c+c).join(''):x;return rgb(parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255);}
export async function buildPDF(reports,title,lang){
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);
 const bytes=await Promise.all(['regular','bold'].map(async n=>{const r=await fetch('/report-assets/'+n+'.ttf');if(!r.ok)throw new Error('Font unavailable');return r.arrayBuffer();}));
 const [regular,bold]=await Promise.all(bytes.map(b=>pdf.embedFont(b,{subset:true}))),sets=[new Set(regular.getCharacterSet()),new Set(bold.getCharacterSet())]; let factor;
 pdf.setTitle('Procats · '+title);pdf.setCreator('Procats');pdf.setLanguage(lang);
 async function draw(page,op,height,dy=0){
  if(op.type==='rect'){const x=op.x*factor,y=(height-op.y-dy)*factor,w=op.w*factor,h=op.h*factor,r=Math.min(op.r||0,op.w/2,op.h/2)*factor;if(r)page.drawSvgPath(`M ${r} 0 H ${w-r} Q ${w} 0 ${w} ${r} V ${h-r} Q ${w} ${h} ${w-r} ${h} H ${r} Q 0 ${h} 0 ${h-r} V ${r} Q 0 0 ${r} 0 Z`,{x,y,color:color(op.color)});else page.drawRectangle({x,y:y-h,width:w,height:h,color:color(op.color)});return;}
  const font=op.bold?bold:regular,set=sets[op.bold?1:0];
  if([...op.text].every(c=>set.has(c.codePointAt(0))))page.drawText(op.text,{x:op.x*factor,y:(height-op.y-dy-op.size*.9)*factor,size:op.size*factor,font,color:color(op.color)});
  else{const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');ctx.font=`${op.bold?700:400} ${op.size*2}px ProcatsReport,sans-serif`;canvas.width=Math.ceil(ctx.measureText(op.text).width)+8;canvas.height=Math.ceil(op.size*3);ctx.font=`${op.bold?700:400} ${op.size*2}px ProcatsReport,sans-serif`;ctx.fillStyle=op.color;ctx.fillText(op.text,0,op.size*2);const image=await pdf.embedPng(canvas.toDataURL('image/png'));page.drawImage(image,{x:op.x*factor,y:(height-op.y-dy-op.size*1.4)*factor,width:canvas.width/2*factor,height:canvas.height/2*factor});}
 }
 if(!Array.isArray(reports))reports=[reports];
 for(const [index,report]of reports.entries()){
  factor=842/report.logicalWidth;
  const page=pdf.addPage([842,report.logicalHeight*factor]);
  for(const op of report.commands)await draw(page,op,report.logicalHeight);
  page.drawText(`${index+1} / ${reports.length}`,{x:790,y:10,size:8,font:regular,color:color('#87929e')});
 }
 return new Blob([await pdf.save()],{type:'application/pdf'});
}
