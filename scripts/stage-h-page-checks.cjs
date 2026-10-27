// Checks the actual packaged renderer; setup is a named isolated mechanics fixture.
const assert=require('node:assert/strict'),path=require('node:path');
module.exports=async function stageHPage(page,output,label){
 const results=[];
 await page.evaluate('window.__stageHRAF=requestAnimationFrame;requestAnimationFrame=()=>0');await page.waitForTimeout(60);
 try{
  for(const hero of ['hopper','minty','ember','nova','bolt']){
   await page.evaluate(hero=>{selectedCharacter=hero;newGame();startLevel(2);enemies=[];pl.x=23*T;pl.y=436;pl.ground=true;pl.inv=0;update();draw();},hero);
   assert.equal(await page.evaluate('pl.highJump'),2);await page.keyboard.down('ArrowRight');
   await page.evaluate('for(let i=0;i<8;i++)update()');await page.keyboard.down('Space');await page.evaluate('for(let i=0;i<36;i++)update();draw()');
   await page.keyboard.up('Space');await page.evaluate('for(let i=0;i<65;i++)update();draw()');await page.keyboard.up('ArrowRight');
   assert.equal(await page.evaluate('lives===3&&pl.highJump===1&&pl.x>31*T&&ability.cooldown===0'),true);
   await page.screenshot({path:path.join(output,`${label}-stage-h-crossing-${hero}.png`)});results.push(`PASS ${hero}: offline actual executable boots pickup and damage-free boosted lower crossing`);
  }
  await page.evaluate("startLevel(5);pl.x=enemies.find(e=>e.type==='guardian').x-100;pl.y=436;cam=pl.x-W/3");
  for(const hp of [5,3,1])for(const phase of ['idle','windup','recover']){
   await page.evaluate(({hp,phase})=>{const e=enemies.find(e=>e.type==='guardian');e.health=hp;e.attackPhase=phase;draw();},{hp,phase});
   assert.equal(await page.locator('#boss-status').textContent(),'');assert.doesNotMatch(await page.locator('#boss-hud').innerText(),/Recovery|stomp|Guarding|Phase|windup|recover/i);
  }
  await page.screenshot({path:path.join(output,`${label}-stage-h-stone-guardian.png`)});results.push('PASS actual executable boss hides state/timer/commands through all three phases');
  await page.evaluate("selectedCharacter='nova';newGame()");return results;
 }finally{await page.evaluate('requestAnimationFrame=window.__stageHRAF;delete window.__stageHRAF;last=performance.now();accum=0;requestAnimationFrame(frame)');}
};
