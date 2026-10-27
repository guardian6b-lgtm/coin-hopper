const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createGame}=require('./harness.cjs');
for(const theme of ['title','meadow','hills','night','garden','cavern','summit','summitRise','summitPeak','boss'])test(`${theme}: original score is deterministic, bounded and sample-continuous at the loop boundary`,()=>{
  const g=createGame();const read=()=>g.eval(`composeMusic('${theme}')`),a=read(),b=read();
  assert.equal(a.samples.length,Math.round(g.eval(`32*60/MUSIC.${theme}.bpm`)*a.sampleRate));
  assert.equal(a.samples[0],0);assert.equal(a.samples.at(-1),0);let peak=0,sum=0;
  for(const value of a.samples){assert.ok(Number.isFinite(value));peak=Math.max(peak,Math.abs(value));sum+=value*value;}
  assert.ok(peak>.02&&peak<.3);assert.ok(Math.sqrt(sum/a.samples.length)>.01);
  const hash=s=>crypto.createHash('sha256').update(Buffer.from(s.buffer,s.byteOffset,s.byteLength)).digest('hex');assert.equal(hash(a.samples),hash(b.samples));
});
test('music respects autoplay: loading/drawing creates no AudioContext or playing source',()=>{
  const g=createGame();g.frame(0);g.frame(16);assert.equal(g.eval('ac'),null);assert.equal(g.audio.sources.length,0);
  g.click('Play');assert.equal(g.eval('musicState.theme'),'title');assert.ok(g.eval('musicState.source.loop'));assert.equal(g.eval('ac.state'),'running');
});
test('all six scene themes and the mandatory boss select the intended distinct arrangement',()=>{
  const g=createGame();g.click('Play');g.click('Start game');
  for(const [level,theme]of ['meadow','hills','night','garden','cavern','summit'].entries()){
    g.eval(`startLevel(${level});syncMusic()`);assert.equal(g.eval('musicState.theme'),theme);
  }
  g.eval("pl.x=LEVELS[5].arenaStart*T;syncMusic()");assert.equal(g.eval('musicState.theme'),'summitPeak');g.eval('bossState.engaged=true;syncMusic()');assert.equal(g.eval('musicState.theme'),'boss');
  g.eval('bossState.defeated=true;syncMusic()');assert.equal(g.eval('musicState.theme'),'summitPeak');
});
test('effects/music route separately through a bounded shared master and compressor',()=>{
  const g=createGame();g.click('Settings');g.input('effects-volume',0);g.input('music-volume',100);
  assert.equal(g.eval('effectsGain.gain.value'),0);assert.equal(g.eval('musicGain.gain.value'),1);assert.equal(g.eval('masterGain.gain.value'),.7);
  assert.equal(g.eval('musicState.source.connections[0].connections[0]===musicGain'),true);assert.equal(g.eval('effectsGain.connections[0]===audioLimiter&&musicGain.connections[0]===audioLimiter'),true);
  assert.equal(g.eval('audioLimiter.ratio.value'),20);assert.equal(g.eval('audioLimiter.threshold.value'),-12);
  g.input('music-volume',0);assert.equal(g.eval('musicState.source'),null);g.input('effects-volume',100);assert.equal(g.eval('effectsGain.gain.value'),1);
});
test('pause/settings/controls freeze the music offset and resume one loop without advancing gameplay',()=>{
  const g=createGame();g.click('Play');g.click('Start game');g.eval('ac.currentTime=3.25');g.click('pause-button');
  assert.equal(g.eval('musicState.offset'),3.25);assert.equal(g.eval('musicState.source'),null);assert.equal(g.eval('masterGain.gain.value'),0);
  const snapshot=g.snapshot('({pl,ability,enemyCombat,timer,score})');g.click('Settings');g.eval('ac.currentTime=9');g.step(120);g.click('Back');g.click('Controls');g.click('Back');
  assert.equal(g.eval('musicState.offset'),3.25);assert.deepEqual(g.snapshot('({pl,ability,enemyCombat,timer,score})'),snapshot);
  g.click('Resume');assert.equal(g.eval('musicState.source.starts[0][1]'),3.25);assert.equal(g.eval('masterGain.gain.value'),.7);
  const count=g.audio.sources.length;g.eval('syncMusic();syncMusic()');assert.equal(g.audio.sources.length,count);
  const events=g.eval('masterGain.gain.values.length+musicGain.gain.values.length');g.eval('for(let i=0;i<600;i++)syncMusic()');assert.equal(g.eval('masterGain.gain.values.length+musicGain.gain.values.length'),events,'steady playback must not grow automation timelines each frame');
});
test('global mute is persistent, separate from volume/character and prevents delayed effects',()=>{
  const g=createGame({saved:{coinhopper_character_v1:'ember',coinhopper_settings:'{"music":0.8,"effects":0.4}'}});g.click('Settings');
  g.element('audio-mute').checked=true;g.domEvent('audio-mute','change');assert.equal(g.eval('masterGain.gain.value'),0);assert.equal(g.eval('musicState.source'),null);
  const count=g.audio.oscillators.length;g.eval('SFX.coin();SFX.win()');g.flushTimeouts();assert.equal(g.audio.oscillators.length,count);
  const reload=createGame({saved:Object.fromEntries(g.storage)});reload.click('Settings');assert.equal(reload.eval('audioPrefs.muted'),true);assert.equal(reload.element('audio-mute').checked,true);assert.equal(reload.eval('selectedCharacter'),'ember');assert.deepEqual(reload.snapshot('settings'),{music:.8,effects:.4});
  reload.element('audio-mute').checked=false;reload.domEvent('audio-mute','change');assert.ok(reload.eval('musicState.source'));assert.equal(reload.eval('masterGain.gain.value'),.7);
});
test('blur and visibility stop audio immediately; focus does not silently resume a paused run',()=>{
  const g=createGame();g.click('Play');g.click('Start game');g.event('blur');assert.equal(g.eval('state'),'pause');assert.equal(g.eval('musicState.source'),null);assert.equal(g.eval('masterGain.gain.value'),0);
  g.event('focus');assert.equal(g.eval('state'),'pause');assert.equal(g.eval('musicState.source'),null);g.click('Resume');assert.ok(g.eval('musicState.source'));
  g.document.hidden=true;g.event('visibilitychange');assert.equal(g.eval('state'),'pause');assert.equal(g.eval('musicState.source'),null);g.document.hidden=false;g.event('visibilitychange');assert.equal(g.eval('state'),'pause');
});
test('completion stops the old loop; new title and restart have a single correct theme',()=>{
  const g=createGame();g.click('Play');g.click('Start game');g.eval("state='done';syncMenu()");assert.equal(g.eval('musicState.source'),null);
  g.click('Title screen');assert.equal(g.eval('musicState.theme'),'title');assert.ok(g.eval('musicState.source'));
  g.click('Play');g.click('Start game');g.eval('startLevel(4)');g.click('pause-button');g.click('Restart level');assert.equal(g.eval('musicState.source'),null);g.click('Restart level');assert.equal(g.eval('musicState.theme'),'cavern');assert.equal(g.eval('musicState.offset'),0);
});
test('blocked storage and unavailable AudioContext preserve safe silent play',()=>{
  const g=createGame({storageBlocked:true});g.click('Settings');g.element('audio-mute').checked=true;assert.doesNotThrow(()=>g.domEvent('audio-mute','change'));
  const absent=createGame();absent.eval("window.AudioContext=function(){throw new Error('Unavailable audio device')}");assert.doesNotThrow(()=>{absent.click('Play');absent.click('Start game');absent.step(10);});assert.equal(absent.eval('ac'),null);assert.equal(absent.eval('state'),'play');
});
test('a rejected autoplay/device resume promise is handled without blocking menus or controls',async()=>{
  const g=createGame();g.click('Settings');g.eval("ac.state='suspended';ac.resume=()=>Promise.reject(new Error('Resume blocked'))");
  assert.doesNotThrow(()=>{g.click('Back');g.click('Play');g.click('Start game');g.step(10);});
  await new Promise(resolve=>setImmediate(resolve));assert.equal(g.eval('state'),'play');
});
