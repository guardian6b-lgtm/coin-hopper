// Optional review WAVs from the exact shipped composer; runtime needs no files.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createGame}=require('../tests/harness.cjs');
module.exports=function exportMusic(output){
  fs.mkdirSync(output,{recursive:true});const game=createGame(),manifest=[];
  for(const theme of game.eval('Object.keys(MUSIC)')){
    const data=game.eval(`composeMusic('${theme}')`),bytes=Buffer.alloc(44+data.samples.length*2);
    bytes.write('RIFF');bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVEfmt ',8);bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);bytes.writeUInt32LE(data.sampleRate,24);bytes.writeUInt32LE(data.sampleRate*2,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(bytes.length-44,40);
    for(let i=0;i<data.samples.length;i++)bytes.writeInt16LE(Math.round(Math.max(-1,Math.min(1,data.samples[i]))*32767),44+i*2);
    const filename=theme+'.wav';fs.writeFileSync(path.join(output,filename),bytes);manifest.push({theme,filename,bytes:bytes.length,seconds:data.duration,sampleRate:data.sampleRate,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
  }
  fs.writeFileSync(path.join(output,'README.txt'),'Original procedural Coin Hopper score authored in index.html MUSIC/composeMusic. Mono 16-bit WAV previews of source loops, before playback volume/master processing. No samples/recordings or external music assets. Audible quality and human approval: NOT TESTED. These are temporary review artifacts, not a public release.\n');
  fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2));return manifest;
};
if(require.main===module){if(!process.argv[2])throw new Error('Usage: node scripts/export-music.cjs OUTPUT');console.log(JSON.stringify(module.exports(process.argv[2]),null,2));}
