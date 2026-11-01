(() => {
 const mix=(a,b,t)=>a.map((v,i)=>Math.round(v*(1-t)+b[i]*t)),hex=a=>'#'+a.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
 function luminance(rgb){const c=rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return .2126*c[0]+.7152*c[1]+.0722*c[2];}
 const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
 function dominant(pixels){const bins=new Map();for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]<128)continue;const rgb=[pixels[i],pixels[i+1],pixels[i+2]],key=rgb.map(v=>Math.round(v/32)).join(',');const b=bins.get(key)||{sum:[0,0,0],count:0};rgb.forEach((v,j)=>b.sum[j]+=v);b.count++;bins.set(key,b);}let best=null,score=-1;for(const b of bins.values()){const color=b.sum.map(v=>v/b.count),s=Math.max(...color)-Math.min(...color),weight=b.count*(1+s/128);if(weight>score){score=weight;best=color;}}return best||[96,132,168];}
 function palette(rgb,mode='auto'){
  const light=mode==='light'||mode==='auto'&&luminance(rgb)>.42,white=[255,255,255],black=[9,13,19];
  const bg=mix(rgb,light?white:black,light?.91:.84),card=mix(rgb,light?white:black,light?.97:.73),nav=mix(rgb,light?white:black,light?.95:.8),text=light?[25,31,40]:[247,249,252],secondary=light?[77,86,100]:[193,204,218];
  let accent=mix(rgb,light?black:white,light?.38:.55);for(let i=0;i<20&&contrast(accent,card)<4.5;i++)accent=mix(accent,light?black:white,.1);
  const ink=contrast(black,accent)>=contrast(white,accent)?black:white;
  return {tone:light?'light':'dark',vars:{'--bg-main':hex(bg),'--bg-nav':hex(nav),'--bg-sidebar':hex(nav),'--bg-card':hex(card),'--bg-modal':hex(card),'--accent-color':hex(accent),'--text-main':hex(text),'--text-secondary':hex(secondary),'--theme-on-accent':hex(ink),'--accent-success':light?'#246b3f':'#a6dfb2','--accent-danger':light?'#a83040':'#ffabb4'}};
 }
 globalThis.ProcatsThemeColors={dominant,palette,luminance,contrast};
})();
