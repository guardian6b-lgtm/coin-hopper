const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),os=require('node:os');
const {chromium,webkit}=require('playwright');const check=require('./stage-h-browser-checks.cjs');
const output=process.env.COIN_HOPPER_TEST_OUTPUT||path.join(os.tmpdir(),'coin-hopper-stage-h');
const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html; charset=utf-8');r.end(fs.readFileSync(path.join(__dirname,'../index.html')));});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
 for(const engine of process.env.STAGE_H_WEBKIT==='1'?['chromium','webkit']:['chromium']){
  const browser=await(engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined)}:{});
  try{console.log((await check(browser,url,output,{engine})).join('\n'));const c=await browser.newContext();try{const p=await c.newPage();await p.goto(url);console.log((await require('./owner-followup-page-checks.cjs')(p,output,engine)).join('\n'));}finally{await c.close();}}finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
