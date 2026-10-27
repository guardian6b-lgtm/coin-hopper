// Rebuild the standalone offline payload after deliberately updating generated art.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),file=path.join(root,'index.html');
const bytes=fs.readFileSync(path.join(root,'docs/art/generated/characters-v1.png'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/art/generated/characters-v1.json'),'utf8'));
assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),manifest.sha256);
const original=fs.readFileSync(file,'utf8');
const html=original.replace(/(<img id="hero-sprites"[^>]*src=")data:image\/png;base64,[^"]+("[^>]*>)/,(_,a,b)=>a+'data:image/png;base64,'+bytes.toString('base64')+b)
  .replace(/const HERO_FRAMES=\[[^;]+;/,'const HERO_FRAMES='+JSON.stringify(manifest.rectangles)+';');
assert.notEqual(html.indexOf(bytes.toString('base64')), -1);
if(process.argv.includes('--check'))assert.equal(html,original,'Embedded art differs: run node scripts/embed-character-art.cjs');
else fs.writeFileSync(file,html);
console.log(process.argv.includes('--check')?'Embedded art matches the archived generated PNG and frame manifest':'Embedded character art rebuilt');
