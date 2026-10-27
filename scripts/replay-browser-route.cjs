// Fixed 60 Hz replay through real keyboard handlers and the shipped simulation.
// The caller suspends RAF; no world/player/enemy edits happen during a route.
module.exports=async function replayBrowserRoute(page,route,capture=async()=>{}){
  const events=[];
  for(const [field,key]of [['jump','Space'],['left','ArrowLeft'],['right','ArrowRight']])
    for(const [frame,down]of route[field]||[])events.push({frame,down,key});
  events.sort((a,b)=>a.frame-b.frame);
  for(const frame of route.captureFrames||[])events.push({frame});
  events.sort((a,b)=>a.frame-b.frame);
  events.push({frame:route.maxFrames||1800});
  await page.keyboard.down('ArrowRight');let tick=0;
  try{
    for(const event of events){
      if(await page.evaluate('state')!=='play')break;
      await page.evaluate(count=>{for(let i=0;i<count&&state==='play';i++)update();draw();},event.frame-tick);
      tick=event.frame;await capture(tick);
      if(await page.evaluate('state')!=='play')break;
      if(event.key)await page.keyboard[event.down?'down':'up'](event.key);
    }
  }finally{for(const key of ['ArrowRight','ArrowLeft','Space'])await page.keyboard.up(key);}
};
