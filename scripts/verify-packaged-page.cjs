// Read-only byte gate for the existing offline single-file packaging contract.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const canonical=cp.execFileSync('git',['show','HEAD:index.html'],{cwd:root,maxBuffer:8*1024*1024});
const source=fs.readFileSync(path.join(root,'index.html')),desktop=fs.readFileSync(path.join(root,'desktop/index.html'));
const digest=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const status=canonical.equals(source)&&source.equals(desktop)?'PASS':'FAIL';
console.log(JSON.stringify({status,canonicalSHA256:digest(canonical),sourceSHA256:digest(source),desktopSHA256:digest(desktop)},null,2));
if(status!=='PASS'){console.error('Canonical Git page, checkout and desktop copy must contain identical bytes.');process.exitCode=1;}
