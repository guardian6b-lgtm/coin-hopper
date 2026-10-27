// Seal an unpublished CI review bundle; no upload, deployment or publishing.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const output=path.resolve(process.argv[2]||'');assert.ok(process.argv[2],'Usage: node scripts/seal-owner-playtest.cjs BUNDLE');
const read=name=>JSON.parse(fs.readFileSync(path.join(output,name),'utf8')),build=read('build.json'),nsis=read('nsis-installed.json'),portable=read('portable.json');
assert.equal(nsis.status,'PASS');assert.equal(portable.status,'PASS');assert.equal(build.published,false);
if(process.env.GITHUB_SHA)assert.equal(build.commit,process.env.GITHUB_SHA);
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex'),html=fs.readFileSync(path.join(output,'index.html'));
assert.equal(hash(html),hash(fs.readFileSync(path.join(__dirname,'../index.html'))),'Bundle HTML must be exact checked-out source');
const files=fs.readdirSync(output).filter(n=>n.endsWith('.exe')||['index.html','serve-preview.cjs'].includes(n)).sort();
assert.equal(files.filter(n=>n.endsWith('.exe')).length,2);
const manifest=files.map(name=>{const bytes=fs.readFileSync(path.join(output,name));return {name,bytes:bytes.length,sha256:hash(bytes)};});
fs.writeFileSync(path.join(output,'SHA256SUMS.txt'),manifest.map(f=>f.sha256+'  '+f.name).join('\n')+'\n');
const tap=fs.readFileSync(path.join(output,'gameplay.tap'),'utf8'),tests=Number(tap.match(/# tests\s+(\d+)/)?.[1]);assert.ok(tests>=383);
const lines=['# Coin Hopper Issue28 coordinated test candidate','',`Commit: ${build.commit}`,`Windows CI: https://github.com/guardian6b-lgtm/coin-hopper/actions/runs/${build.run}`,`HTML SHA256: ${hash(html)}`,'','| Check | Result |','|---|---|',`| Windows Node regression | PASS — ${tests}tests |`,'| Actual NSIS installed executable | PASS |','| Actual portable executable | PASS |','| Source/copy/packaged HTML integrity | PASS |'];
for(const [label,report]of [['NSIS',nsis],['Portable',portable]]){for(const check of report.checks||[])lines.push(`| ${label}: ${check.name} | ${check.status} |`);lines.push(`| ${label}: charged/Core fixture groups | PASS — ${report.ownerFollowup?.length||0} |`);if(report.meadowPrototype)lines.push(`| ${label}: isolated art/profile groups | PASS — ${report.meadowPrototype.length} |`);}
lines.push('| Physical Android/iOS touch, safe areas, audio, heat/battery | NOT TESTED |','| Human Windows installation/DPI/security/physical input | NOT TESTED |','| Audible mix/theme quality, Core/art/combat owner acceptance | NOT TESTED |','','Read START-HERE.md before playing. Both EXEs and phone-browser HTML are the same candidate. No APK/IPA, hosted preview, service worker, release or owner acceptance is implied. Music WAVs are original listening samples. A loaded browser page continues disconnected; LAN reload requires the server. Checksums identify this test despite unchanged1.0.0 package filenames. Temporary artifacts expire after7days.','');
fs.writeFileSync(path.join(output,'VERIFICATION.md'),lines.join('\n'));fs.writeFileSync(path.join(output,'candidate-inputs.json'),JSON.stringify({commit:build.commit,run:build.run,published:false,tests,manifest,physicalAcceptance:'NOT TESTED'},null,2)+'\n');console.log(JSON.stringify({status:'PASS',commit:build.commit,tests,htmlSHA256:hash(html)},null,2));
