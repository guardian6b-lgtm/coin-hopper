// Original synthesized Foley only; no listening approval is implied by export.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process'),{createGame}=require('../tests/harness.cjs');
const out=path.resolve(process.argv[2]||'/tmp/coin-hopper-stage-i-audio');fs.mkdirSync(out,{recursive:true});const game=createGame(),files=[];
for(const kind of ['step','open','fracture','rumble','impact']){
 const data=game.snapshot(`({samples:Array.from(composeGuardianSfx('${kind}').samples),sampleRate:22050})`),pcm=Buffer.alloc(data.samples.length*2);
 data.samples.forEach((s,i)=>pcm.writeInt16LE(Math.round(Math.max(-1,Math.min(1,s))*32767),i*2));
 const wav=Buffer.alloc(44);wav.write('RIFF');wav.writeUInt32LE(36+pcm.length,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(data.sampleRate,24);wav.writeUInt32LE(data.sampleRate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(pcm.length,40);
 const file=path.join(out,`guardian-${kind}.wav`);fs.writeFileSync(file,Buffer.concat([wav,pcm]));const encoded=spawnSync('ffmpeg',['-y','-loglevel','error','-i',file,'-c:a','libvorbis','-q:a','5',file.replace(/\.wav$/,'.ogg')],{encoding:'utf8'});if(encoded.status!==0)throw new Error(encoded.stderr||'FFmpeg OGG encoder unavailable');files.push(path.basename(file));
}
fs.writeFileSync(path.join(out,'README.txt'),'Original deterministic synthesized C3 Guardian Foley from the exact game composer. WAV mono22050Hz/16bit and OGG Vorbis. Routed through the existing effects-volume bus in game. Audible/device/owner acceptance NOT TESTED. These are effects, not the deferred full music arrangements.\n');console.log('PASS exported '+files.join(', '));
