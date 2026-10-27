// Actual local file URL, distinct from the HTTP/fulfilled-offline browser suites.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
module.exports=async function verifyFile(browser,output){
  const context=await browser.newContext({viewport:{width:960,height:540}}),errors=[],remote=[];
  try{
    await context.setOffline(true);const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
    const url=pathToFileURL(path.join(__dirname,'../index.html')).href;
    try{await page.goto(url);}catch(error){
      if(/ERR_(BLOCKED_BY_ADMINISTRATOR|ACCESS_DENIED|BLOCKED_BY_CLIENT)/.test(error.message)){
        fs.writeFileSync(path.join(output,'file-browser-results.json'),JSON.stringify({status:'NOT TESTED',reason:'Browser/environment denied local file navigation; no override attempted.',detail:error.message,url},null,2));
        if(process.env.GITHUB_ACTIONS)console.log('::notice title=Coin Hopper browser file mode::NOT TESTED: environment denied local-file navigation; no override attempted.');
        return ['NOT TESTED local browser file URL: environment denied access; HTTP/offline and actual Electron file checks are separate'];
      }throw error;
    }
    const storageAvailable=await page.evaluate(()=>{try{localStorage.setItem('__coin_hopper_file_probe','1');const ok=localStorage.getItem('__coin_hopper_file_probe')==='1';localStorage.removeItem('__coin_hopper_file_probe');return ok;}catch(e){return false;}});
    assert.ok(page.url().startsWith('file:'));await page.getByRole('button',{name:'Play',exact:true}).click();await page.getByRole('button',{name:'Ember',exact:true}).click();await page.getByRole('button',{name:'Start game',exact:true}).click();
    const start=await page.evaluate('pl.x');await page.keyboard.down('ArrowRight');await page.waitForFunction(x=>pl.x>x+30,start);await page.keyboard.up('ArrowRight');
    await page.keyboard.press('KeyE');await page.waitForFunction('ability.cooldown>0');await page.keyboard.press('KeyP');
    const frozen=await page.evaluate('JSON.stringify({pl,enemies,ability,timer,score})');await page.waitForTimeout(80);assert.equal(await page.evaluate('JSON.stringify({pl,enemies,ability,timer,score})'),frozen);
    await page.getByRole('button',{name:'Settings',exact:true}).click();for(const [name,value]of [['effects',40],['music',20]])await page.locator('#'+name+'-volume').evaluate((input,value)=>{input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));},value);
    await page.reload();
    if(storageAvailable){assert.equal(await page.evaluate('selectedCharacter'),'ember');assert.deepEqual(await page.evaluate('({music:settings.music,effects:settings.effects})'),{music:.2,effects:.4});assert.equal(await page.evaluate('progress.started'),true);}
    else{assert.equal(await page.evaluate('selectedCharacter'),'hopper');assert.equal(await page.evaluate('progress.started'),false);}
    await page.getByRole('button',{name:storageAvailable?'Continue':'Play',exact:true}).click();await page.getByRole('button',{name:'Start game',exact:true}).click();assert.equal(await page.evaluate('score===0&&lives===3&&ability.cooldown===0'),true);
    for(const size of [{width:390,height:844},{width:844,height:390}]){await page.setViewportSize(size);await page.waitForFunction('Math.abs(parseFloat(cv.style.width)-Math.min(innerWidth/960,innerHeight/540)*960)<.1');}
    await page.screenshot({path:path.join(output,'offline-file-browser.png')});assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
    fs.writeFileSync(path.join(output,'file-browser-results.json'),JSON.stringify({status:'PASS',url,offline:true,remoteRequests:remote,errors,persistence:storageAvailable?'PASS':'NOT TESTED: file storage unavailable; safe fallback verified',checks:['real file URL','native menus/keyboard E','pause freeze',storageAvailable?'character/volume/progress reload persistence':'blocked file storage fallback','fresh attempt','portrait/landscape resize'],physicalHardware:'NOT TESTED'},null,2));
    if(process.env.GITHUB_ACTIONS)console.log(`::notice title=Coin Hopper browser file mode::PASS: actual offline file URL and controls; persistence ${storageAvailable?'PASS':'NOT TESTED (storage unavailable, fallback verified)'}.`);
    return [`PASS actual offline Chromium file URL, keyboard/power/pause, ${storageAvailable?'persisted character/settings/progress and Continue':'safe unavailable-storage fallback'} and resizing without remote requests`];
  }finally{await context.close();}
};
