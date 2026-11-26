'use strict';
const fs=require('node:fs'),path=require('node:path');
const {createGame,onFlatGround}=require('./harness.cjs');
const {composeDevelopmentPage}=require('../scripts/ember-preview.cjs');
const directory = path.resolve(__dirname, '../dev/shellback-s1');
const files = ['walk-metadata.json', 'shellback_intact_walk_strip_1x_56x40x10.png', 'shellback_cracked_walk_strip_1x_56x40x10.png'];
const known = {};
for (const name of files.filter(file => file.endsWith('.png'))) {
  const png = fs.readFileSync(path.join(directory, name));
  const state = name.includes('cracked') ? 'cracked' : 'intact';
  known['data:image/png;base64,' + png.toString('base64')] = [state, png.readUInt32BE(16), png.readUInt32BE(20)];
}
async function setup({ enabled = true, failure = '' } = {}) {
  const stub = 'const known=' + JSON.stringify(known) + ',failure=' + JSON.stringify(failure) + ';' +
    'globalThis.Image=class {set src(uri){const [state,w,h]=known[uri];this.state=state;this.naturalWidth=state==="cracked"&&failure==="size"?w-1:w;this.naturalHeight=h;' +
    'Promise.resolve().then(()=>this.state==="cracked"&&failure==="load"?this.onerror():this.onload());}' +
    'decode(){return this.state==="cracked"&&failure==="decode"?Promise.reject(Error("test decode")):Promise.resolve();}};';
  const page = composeDevelopmentPage({ shellback: enabled }).toString().replace('<script>', () => '<script>' + stub);
  const game = onFlatGround(createGame({ html: page }));
  await new Promise(resolve => setImmediate(resolve));
  game.eval('shields=[];highJumps=[];coreItems=[];globalThis.actor=createEnemy("shellback",300,13*T-28);actor.ground=true;enemies=[actor];');
  game.eval('globalThis.sample=null;let anchor,scale;cx.translate=(x,y)=>{anchor=[x,y]};cx.scale=(x,y)=>{scale=[x,y]};' +
    'cx.drawImage=(image,...args)=>{if(image.state)sample={state:image.state,anchor,scale,args}};');
  return game;
}
function paint(game) { game.eval('sample=null;drawEnemy(actor)'); return game.snapshot('sample'); }

module.exports = { setup, paint, directory, files };
