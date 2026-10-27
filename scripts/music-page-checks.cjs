// Native UI + real Web Audio rendering; never claims audible/device acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
module.exports=async function verifyMusicPage(page,output,label='browser'){
  const results=[],initial=await page.evaluate('({settings:{...settings},muted:audioPrefs.muted})');
  const volume=async(name,value)=>page.locator('#'+name+'-volume').evaluate((input,value)=>{input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));},value);
  try{
    await page.evaluate("showMenu('title','title')");await page.getByRole('button',{name:'Settings',exact:true}).click();
    await page.waitForFunction('ac&&musicGain&&masterGain');
    await volume('effects',0);await volume('music',100);
    await page.waitForFunction('musicState.source?.loop&&effectsGain.gain.value===0&&musicGain.gain.value===1');
    await page.getByRole('checkbox',{name:'Mute all audio',exact:true}).check();
    await page.waitForFunction('audioPrefs.muted&&masterGain.gain.value===0&&musicState.source===null');
    await page.reload();await page.getByRole('button',{name:'Settings',exact:true}).click();
    assert.equal(await page.getByRole('checkbox',{name:'Mute all audio',exact:true}).isChecked(),true);
    await page.waitForFunction('audioPrefs.muted&&masterGain.gain.value===0');
    await page.getByRole('checkbox',{name:'Mute all audio',exact:true}).uncheck();
    await page.screenshot({path:path.join(output,`${label}-music-settings.png`)});
    results.push('PASS native independent volumes and persistent mute in the real offline-capable renderer');
    await page.getByRole('button',{name:'Back',exact:true}).click();await page.getByRole('button',{name:'Play',exact:true}).click();await page.getByRole('button',{name:'Start game',exact:true}).click();
    await page.waitForTimeout(80);await page.keyboard.press('KeyP');
    const offset=await page.evaluate('musicState.offset'),snapshot=await page.evaluate('JSON.stringify({pl,ability,enemyCombat,timer,score})');
    await page.getByRole('button',{name:'Settings',exact:true}).click();await page.waitForTimeout(80);
    assert.equal(await page.evaluate('musicState.offset'),offset);assert.equal(await page.evaluate('musicState.source'),null);
    assert.equal(await page.evaluate('JSON.stringify({pl,ability,enemyCombat,timer,score})'),snapshot);
    await page.getByRole('button',{name:'Back',exact:true}).click();await page.getByRole('button',{name:'Resume',exact:true}).click();
    await page.waitForFunction('!!musicState.source&&Math.abs(masterGain.gain.value-.7)<1e-6');
    await page.evaluate("dispatchEvent(new Event('blur'))");await page.waitForFunction('state==="pause"&&musicState.source===null&&masterGain.gain.value===0');
    await page.evaluate("dispatchEvent(new Event('focus'))");assert.equal(await page.evaluate('state'), 'pause');
    await page.getByRole('button',{name:'Resume',exact:true}).click();
    results.push('PASS actual keyboard pause/settings/resume preserve loop position; injected blur/focus keeps the game paused');
    const themes=await page.evaluate(async()=>{
      const report=[];for(const theme of Object.keys(MUSIC)){
        const data=composeMusic(theme),context=new OfflineAudioContext(1,data.samples.length*2, data.sampleRate);
        const graph=createAudioGraph(context);graph.music.gain.value=1;graph.effects.gain.value=0;
        const buffer=context.createBuffer(1,data.samples.length,data.sampleRate);buffer.getChannelData(0).set(data.samples);
        const source=context.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(graph.music);source.start();
        const samples=(await context.startRendering()).getChannelData(0);let peak=0,sum=0,signature=2166136261;
        for(let i=0;i<samples.length;i++){peak=Math.max(peak,Math.abs(samples[i]));sum+=samples[i]*samples[i];if(i<10000)signature=Math.imul(signature^Math.round(samples[i]*1e7),16777619);}
        const edge=data.samples.length,seam=Math.abs(samples[edge]-samples[edge-1]);
        report.push({theme,peak,rms:Math.sqrt(sum/samples.length),seam,signature,loop:source.loop,duration:data.duration,first:data.samples[0],last:data.samples.at(-1)});
      }return report;
    });
    assert.equal(themes.length,8);assert.equal(new Set(themes.map(t=>t.signature)).size,8);
    for(const theme of themes){assert.ok(theme.peak>0&&theme.peak<1&&theme.rms>.001&&theme.loop&&theme.seam<.01,JSON.stringify(theme));assert.equal(theme.first,0);assert.equal(theme.last,0);}
    results.push('PASS eight distinct real OfflineAudioContext themes, two continuous loops each, bounded signal and measured loop seams');
    await page.evaluate('window.__musicRAF=requestAnimationFrame;requestAnimationFrame=()=>0');await page.waitForTimeout(40);
    let mixing;
    try{mixing=await page.evaluate(async()=>{
      const old={ac,effectsGain,musicGain,masterGain,audioLimiter,musicState,settings:{...settings},muted:audioPrefs.muted,pl,enemies,parts,score,levelScore};
      const report=[];
      try{
        for(const [name,music,effects,muted]of [['music-only',1,0,false],['effects-only',0,1,false],['silent',0,0,false],['muted',1,1,true],['overlap',1,1,false]]){
          ac=new OfflineAudioContext(1,48000,48000);const graph=createAudioGraph(ac);effectsGain=graph.effects;musicGain=graph.music;masterGain=graph.master;audioLimiter=graph.limiter;
          musicState={theme:'',source:null,offset:0,started:0};settings.music=music;settings.effects=effects;audioPrefs.muted=muted;
          pl={...old.pl,y:300,ground:false,vy:100,inv:0};parts=[];enemies=[];applySettings();
          for(const hero of CHARACTERS){resetAbility();pl.character=hero.id;pl.y=300;pl.ground=false;pl.vy=100;enemies=[createEnemy('walker',pl.x+70,310),createEnemy('walker',pl.x+120,310)];useAbility();abilitySounds.clear();}
          SFX.jump();SFX.stomp();SFX.hurt();enemySound(95,.24,'triangle',35,.16);
          for(let i=0;i<16;i++)snd(330+i*22,.2,'triangle',660,.15);
          const samples=(await ac.startRendering()).getChannelData(0);let peak=0,sum=0;
          for(const value of samples){peak=Math.max(peak,Math.abs(value));sum+=value*value;}
          report.push({name,peak,rms:Math.sqrt(sum/samples.length)});stopMusic(true);abilitySounds.clear();enemySounds.clear();
        }
      }finally{
        ac=old.ac;effectsGain=old.effectsGain;musicGain=old.musicGain;masterGain=old.masterGain;audioLimiter=old.audioLimiter;musicState=old.musicState;
        settings.music=old.settings.music;settings.effects=old.settings.effects;audioPrefs.muted=old.muted;pl=old.pl;enemies=old.enemies;parts=old.parts;score=old.score;levelScore=old.levelScore;resetAbility();applySettings();
      }return report;
    });}finally{await page.evaluate('requestAnimationFrame=window.__musicRAF;delete window.__musicRAF;last=performance.now();accum=0;requestAnimationFrame(frame)');}
    for(const row of mixing){assert.ok(row.peak<.99,JSON.stringify(row));if(row.name==='silent'||row.name==='muted')assert.equal(row.rms,0);else assert.ok(row.rms>.001,JSON.stringify(row));}
    results.push('PASS real master routing: independent buses, global mute, overlapping five power/enemy SFX and music remain below clipping');
    fs.writeFileSync(path.join(output,`${label}-music-results.json`),JSON.stringify({results,themes,mixing,listening:'NOT TESTED',physicalHardware:'NOT TESTED'},null,2));
    return results;
  }finally{
    await page.evaluate(initial=>{settings.music=initial.settings.music;settings.effects=initial.settings.effects;setMuted(initial.muted);saveSettings();showMenu('title','title');},initial);
  }
};
