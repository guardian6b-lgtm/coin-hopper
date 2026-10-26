// Real-time power smoke checks in each actual installed/portable executable.
const assert = require('node:assert/strict');
const path = require('node:path');
module.exports = async function verifyExecutableAbilities(app, output, label) {
  const page=app.page, results=[];
  for(const id of ['hopper','minty','ember','nova','bolt']) {
    if(await page.evaluate('state')==='play')await page.keyboard.press('Escape');
    await page.getByRole('button',{name:'Title screen',exact:true}).click();
    await page.getByRole('button',{name:'Play',exact:true}).click();
    await page.getByRole('button',{name:id[0].toUpperCase()+id.slice(1),exact:true}).click();
    await page.getByRole('button',{name:'Start game',exact:true}).click();
    await page.evaluate(id=>{
      startLevel(3);pl.x=4*T;pl.y=13*T-pl.h;pl.vx=0;pl.vy=0;pl.ground=true;pl.inv=0;
      enemies=[{x:pl.x+90,y:440,w:28,h:28,vx:0,vy:0,dead:0,ground:true}];
      if(id==='hopper'){pl.y=300;pl.ground=false;enemies[0].x=pl.x+55;}
      if(id==='nova'){pl.y=300;pl.ground=false;pl.vy=300;}
      if(id==='bolt')enemies.push({x:pl.x+160,y:440,w:28,h:28,vx:0,vy:0,dead:0,ground:true});
    },id);
    await page.keyboard.press('KeyE');await page.waitForFunction('ability.cooldown>0');
    assert.equal(await page.evaluate('pl.character'),id);
    if(id==='hopper'||id==='ember')await page.waitForFunction('score===50');
    else if(id==='bolt')await page.waitForFunction('score===100');
    else if(id==='minty'){
      const before=await page.evaluate('JSON.stringify({x:enemies[0].x,y:enemies[0].y})');
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate('JSON.stringify({x:enemies[0].x,y:enemies[0].y})'),before);
      assert.ok(await page.evaluate('enemies[0].root')>0);
    }else assert.ok(await page.evaluate('pl.vy')<=140&&await page.evaluate('ability.remaining')>0);
    await page.screenshot({path:path.join(output,`${label}-power-${id}.png`)});
    await page.keyboard.press('KeyP');
    const frozen=await page.evaluate('JSON.stringify({ability,enemies,pl,score,lives,timer})');
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate('JSON.stringify({ability,enemies,pl,score,lives,timer})'),frozen);
    assert.equal(await page.locator('#ability-button').isVisible(),false);
    await page.getByRole('button',{name:'Resume',exact:true}).click();
    results.push({character:id,status:'PASS',checks:['E activation','intended resolution','power screenshot','cooldown/pause freeze']});
  }
  // Restore the saved character expected by the existing lifecycle/persistence gate.
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'Title screen',exact:true}).click();
  assert.equal(await page.evaluate('ability.cooldown===0&&!ability.projectiles.length&&!ability.effects.length'),true);
  await page.getByRole('button',{name:'Play',exact:true}).click();
  await page.getByRole('button',{name:'Nova',exact:true}).click();
  await page.getByRole('button',{name:'Start game',exact:true}).click();
  return results;
};
