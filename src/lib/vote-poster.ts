export type PosterEntry = { category: string; nominee: { id:string; display_name:string; avatar_url:string|null; ext?:{image_fit?:string;image_position?:string}|null } }

export function posterLayout(count: number) {
  if(count<1 || count>12) throw new Error('El diseño admite de 1 a 12 categorías.')
  const columns=count===1?1:2
  const rows=Math.ceil(count/columns), gap=18
  const w=count===1?650:(976-gap*(columns-1))/columns
  const h=Math.min(800,(880-gap*(rows-1))/rows)
  return Array.from({length:count},(_,i)=>{
    const row=Math.floor(i/columns), inRow=Math.min(columns,count-row*columns)
    return {x:(1080-(inRow*w+(inRow-1)*gap))/2+(i%columns)*(w+gap),y:320+(880-(rows*h+(rows-1)*gap))/2+row*(h+gap),w,h}
  })
}
async function load(src:string):Promise<HTMLImageElement|null> {
  return new Promise(resolve=>{
    const img=new Image()
    const timer=setTimeout(()=>{img.onload=null;img.onerror=null;resolve(null)},15000)
    img.onload=()=>{clearTimeout(timer);resolve(img)}
    img.onerror=()=>{clearTimeout(timer);resolve(null)}
    img.src=src
  })
}
function fit(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,w:number,size:number,serif=false) {
  do {ctx.font=`${serif?'normal':'600'} ${size--}px ${serif?'Georgia':'Arial'}`}while(ctx.measureText(text).width>w && size>14)
  ctx.fillText(text,x,y)
}
export async function drawVotePoster(canvas:HTMLCanvasElement,entries:PosterEntry[],slug:string) {
  const layout=posterLayout(entries.length)
  const [logo,...images]=await Promise.all([load('/chaparritaspng.png'),...entries.map(e=>e.nominee.avatar_url?load(e.nominee.avatar_url.startsWith('/nominees/')?e.nominee.avatar_url:`/api/share-portrait/${e.nominee.id}`):Promise.resolve(null))])
  canvas.width=1080;canvas.height=1350
  const ctx=canvas.getContext('2d')
  if(!ctx) throw new Error('Tu navegador no pudo generar la imagen.')
  const bg=ctx.createLinearGradient(0,0,1080,1350);bg.addColorStop(0,'#163e47');bg.addColorStop(.6,'#061d25');bg.addColorStop(1,'#123039')
  ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1350)
  ctx.strokeStyle='#e8d09c55';ctx.lineWidth=2;ctx.strokeRect(26,26,1028,1298)
  ctx.strokeStyle='#e8d09c12';ctx.beginPath();ctx.arc(1080,0,850,0,Math.PI*2);ctx.stroke()
  if(logo){const scale=Math.min(76/logo.width,98/logo.height);ctx.drawImage(logo,58,48,logo.width*scale,logo.height*scale)}
  ctx.textAlign='center';ctx.fillStyle='#eed5a0';fit(ctx,'Gorritos D’or',540,112,750,68,true)
  ctx.fillStyle='#a6c4c8';ctx.font='18px Arial';ctx.fillText(`A W A R D S  /  ${slug}`,540,152)
  ctx.fillStyle='#7cd8cf';ctx.font='18px Arial';ctx.fillText('Y O  Y A  V O T É',540,216)
  ctx.fillStyle='#eed5a0';fit(ctx,'Mi elección. Mi comunidad.',540,274,950,48,true)
  entries.forEach((e,i)=>{
    const {x,y,w,h}=layout[i], img=images[i], n=e.nominee
    if(entries.length>4){
      const side=Math.min(h-24,180),px=x+12,py=y+(h-side)/2
      ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,16);ctx.clip();ctx.fillStyle='#173640';ctx.fillRect(x,y,w,h)
      ctx.save();ctx.beginPath();ctx.roundRect(px,py,side,side,10);ctx.clip()
      if(img){const scale=n.ext?.image_fit==='contain'?Math.min(side/img.width,side/img.height):Math.max(side/img.width,side/img.height);ctx.drawImage(img,px+(side-img.width*scale)/2,py+(side-img.height*scale)/2,img.width*scale,img.height*scale)}
      else{ctx.fillStyle='#eed5a0';fit(ctx,n.display_name.slice(0,2).toUpperCase(),px+side/2,py+side/2+15,side-10,42,true)}
      ctx.restore()
      const textX=px+side+16,textW=w-side-52
      ctx.fillStyle='#9fc9ca';fit(ctx,e.category.replace(/\?$/,'').toUpperCase(),textX+textW/2,y+h/2-13,textW,18)
      ctx.fillStyle='#f1f5ed';fit(ctx,n.display_name,textX+textW/2,y+h/2+24,textW,30)
      ctx.restore();ctx.strokeStyle='#b4d0c940';ctx.beginPath();ctx.roundRect(x,y,w,h,16);ctx.stroke()
      return
    }
    const labelH=48, nameH=58, photoH=h-labelH-nameH
    ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,18);ctx.clip();ctx.fillStyle='#173640';ctx.fillRect(x,y,w,h)
    ctx.fillStyle='#a7d0d0';fit(ctx,e.category.replace(/\?$/,'').toUpperCase(),x+w/2,y+30,w-24,entries.length>6?18:21)
    ctx.save();ctx.beginPath();ctx.rect(x,y+labelH,w,photoH);ctx.clip()
    if(img){
      const scale=n.ext?.image_fit==='contain'?Math.min(w/img.width,photoH/img.height):Math.max(w/img.width,photoH/img.height)
      const match=n.ext?.image_position?.match(/^([\d.]+)%/), px=match?Math.max(0,Math.min(1,Number(match[1])/100)):.5
      ctx.drawImage(img,x+(w-img.width*scale)*px,y+labelH+(photoH-img.height*scale)/2,img.width*scale,img.height*scale)
    }else{ctx.fillStyle='#eed5a0';fit(ctx,n.display_name.slice(0,2).toUpperCase(),x+w/2,y+labelH+photoH/2+20,w-30,64,true)}
    ctx.restore();ctx.fillStyle='#09252f';ctx.fillRect(x,y+h-nameH,w,nameH);ctx.fillStyle='#f1f5ed';fit(ctx,n.display_name,x+w/2,y+h-20,w-26,entries.length>6?27:32)
    ctx.restore();ctx.strokeStyle='#b4d0c940';ctx.beginPath();ctx.roundRect(x,y,w,h,18);ctx.stroke()
  })
  ctx.fillStyle='#eed5a0';ctx.font='21px Arial';ctx.fillText(`${entries.length} ${entries.length===1?'CATEGORÍA':'CATEGORÍAS'} · MI VOTO CELEBRA A LA COMUNIDAD`,540,1260)
  ctx.fillStyle='#9ab8be';ctx.font='17px Arial';ctx.fillText('LOS MOMENTOS QUEDAN. NOSOTROS LOS CELEBRAMOS.',540,1292)
  return {url:canvas.toDataURL('image/png'),missing:entries.filter((e,i)=>e.nominee.avatar_url&&!images[i]).map(e=>e.nominee.display_name)}
}
