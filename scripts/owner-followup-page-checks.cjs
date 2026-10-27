// Real renderer + native key delivery. Named fixtures isolate combat; canonical
// no-power routes elsewhere never edit actors, world geometry or rewards.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
module.exports=async function followupPage(page,output,label='browser'){
 const initial=await page.evaluate('selectedCharacter');const results=[];await page.evaluate('window.__followupRAF=requestAnimationFrame;requestAnimationFrame=()=>0');await page.waitForTimeout(40);
 const step=n=>page.evaluate(n=>{for(let i=0;i<n;i++)update();draw();},n);
 const ready=async hero=>page.evaluate(hero=>{selectedCharacter=hero;newGame();enemies=[createEnemy('shellback',pl.x+80,440),createEnemy('shellback',pl.x+150,440)];enemies.forEach(e=>e.vx=0);pl.y=436;pl.ground=true;draw();},hero);
 try{
  for(const hero of ['hopper','minty','ember','nova','bolt']){
   for(const [frames,tier]of [[0,0],[24,1],[48,2],[72,3]]){
    await ready(hero);await page.keyboard.down('KeyE');await step(frames);
    assert.equal(await page.evaluate('ability.charging&&ability.cooldown===0'),true);
    assert.equal(await page.evaluate('chargeTier(ability.charge)'),tier);
    if(['hopper','nova'].includes(hero))await page.evaluate('pl.y=300;pl.ground=false;pl.vy=50');
    await page.keyboard.up('KeyE');await step(1);
    assert.equal(await page.evaluate('ability.power.tier'),tier);assert.ok(await page.evaluate('ability.cooldown')>0);
    if(tier===3){await step(2);await page.screenshot({path:path.join(output,`${label}-charged-${hero}.png`)});}
   }
   await ready(hero);await page.keyboard.down('KeyE');await step(40);await page.keyboard.press('KeyP');await page.keyboard.up('KeyE');
   const frozen=await page.evaluate('JSON.stringify({ability,pl,enemies,timer})');await step(100);assert.equal(await page.evaluate('JSON.stringify({ability,pl,enemies,timer})'),frozen);
   await page.getByRole('button',{name:'Resume',exact:true}).click();await step(1);assert.equal(await page.evaluate('ability.charging||ability.cooldown>0'),false);
   results.push(`PASS ${hero}: four native E charge/release tiers; pause cancels and freezes safely`);
   await ready(hero);await page.evaluate('pl.core={ammo:6,cooldown:0};draw()');assert.equal(await page.locator('#core-button').isVisible(),true);
   await page.keyboard.press('KeyF');await step(20);assert.equal(await page.evaluate('pl.core.ammo'),5);assert.equal(await page.evaluate('enemies[0].health'),1);assert.equal(await page.evaluate('ability.cooldown'),0);
   assert.equal(await page.locator('#core-button').isDisabled(),true);await page.locator('#core-button').dispatchEvent('click');await step(1); // even injected clicks cannot bypass cooldown
   assert.equal(await page.evaluate('pl.core.ammo'),5);
   await page.evaluate('pl.shield=true;pl.inv=0;hurt()');assert.equal(await page.evaluate('!pl.shield&&pl.core.ammo===5&&lives===3'),true);
   await page.evaluate('pl.inv=0;hurt()');assert.equal(await page.evaluate('pl.core===null&&lives===3'),true);
   results.push(`PASS ${hero}: native F/context button, finite Core, independent special and shield-first absorption`);
  }
  await ready('hopper');await page.evaluate("startLevel(5);const b=enemies.find(e=>e.type==='guardian');b.attackPhase='recover';b.openingHit=false;b.attackTimer=2.8;pl.x=b.x-70;pl.y=436;cam=pl.x-W/3;draw()");
  await page.screenshot({path:path.join(output,`${label}-guardian-open.png`)});
  assert.equal(await page.evaluate("(()=>{const b=enemies.find(e=>e.type==='guardian');return damageEnemy(b,'slam','#fff',3)&&!damageEnemy(b,'fireball','#fff',3)&&b.health===4&&b.attackTimer===2.8})()"),true);
  await page.screenshot({path:path.join(output,`${label}-guardian-hit.png`)});results.push('PASS Guardian: bright opening, one HP maximum at full charge, preserved2.8s recovery');
  await page.evaluate("showMenu('title','title')");return results;
 }finally{await page.evaluate(initial=>{selectedCharacter=initial;newGame();},initial);await page.evaluate('requestAnimationFrame=window.__followupRAF;delete window.__followupRAF;last=performance.now();accum=0;requestAnimationFrame(frame)');fs.writeFileSync(path.join(output,`${label}-owner-followup.json`),JSON.stringify({results,humanAcceptance:'NOT TESTED'},null,2));}
};
