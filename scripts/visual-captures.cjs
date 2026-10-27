// Real renderer captures. Scene placements are labeled fixtures, never route evidence.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const sizes=[{width:960,height:540},{width:1440,height:810},{width:960,height:360},{width:390,height:844},{width:844,height:390}];
module.exports=async function captureVisual(page,output,label,resize=size=>page.setViewportSize(size)){
  fs.mkdirSync(output,{recursive:true});const captures=[];
  if(await page.locator('#hero-sprites').count())await page.waitForFunction('heroArt.complete&&heroArt.naturalWidth>0');
  const snap=async name=>{const filename=`${label}-${name}.png`;await page.screenshot({path:path.join(output,filename)});captures.push(filename);};
  const paint=()=>page.evaluate('draw()');
  await page.evaluate('window.__captureRAF=requestAnimationFrame;requestAnimationFrame=()=>0');await page.waitForTimeout(60);
  try{
    for(const size of sizes){
      await resize(size);await page.waitForFunction(({width,height})=>innerWidth===width&&innerHeight===height,size);await page.evaluate("showMenu('title','title');draw()");
      await snap(`title-${size.width}x${size.height}`);
      await page.getByRole('button',{name:'Play',exact:true}).click();
      await page.locator('.menu-panel').evaluate(el=>el.scrollTop=0);await snap(`picker-${size.width}x${size.height}`);
      for(const name of ['Hopper','Minty','Ember','Nova','Bolt','Start game','Back']){
        const button=page.getByRole('button',{name,exact:true});await button.scrollIntoViewIfNeeded();const b=await button.boundingBox();
        assert.ok(b&&b.x>=0&&b.y>=-1&&b.x+b.width<=size.width+1&&b.y+b.height<=size.height+1,JSON.stringify({name,b,size}));
        assert.ok(b.width>=44&&b.height>=44);
      }
      await page.getByRole('button',{name:'Nova',exact:true}).click();await page.getByRole('button',{name:'Start game',exact:true}).click();
      await page.evaluate("startLevel(5);const boss=enemies.find(e=>e.type==='guardian');pl.x=boss.x-120;pl.y=436;pl.inv=0;cam=pl.x-W/3;draw()");
      await snap(`boss-fixture-${size.width}x${size.height}`);
    }
    await resize(sizes[0]);await page.waitForTimeout(40);
    for(let level=0;level<6;level++){await page.evaluate(i=>{startLevel(i);pl.inv=0;draw();},level);await snap(`level-${level+1}-fixture`);}
    for(const screen of ['pause','controls','settings','restart','done','over','win']){await page.evaluate(s=>{showMenu(s,'pause');draw();},screen);await snap(`menu-${screen}-fixture`);}
    return captures;
  }finally{
    await page.evaluate("showMenu('title','title');requestAnimationFrame=window.__captureRAF;delete window.__captureRAF;last=performance.now();accum=0;requestAnimationFrame(frame)");
  }
};
module.exports.sizes=sizes;
