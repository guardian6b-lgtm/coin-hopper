const verify=require('./music-page-checks.cjs');
const fs=require('node:fs'),path=require('node:path');
const assert=require('node:assert/strict');
module.exports=async function verifyMusic(browser,url,output){
  const context=await browser.newContext({viewport:{width:960,height:540}});
  try{
    const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
    await context.route(url,route=>route.fulfill({status:200,contentType:'text/html',body:html}));
    await context.setOffline(true);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);const result=await verify(page,output,'browser');assert.deepEqual(errors,[]);return result;
  }
  finally{await context.close();}
};
if(require.main===module)(async()=>{
  const {chromium}=require('playwright'),http=require('node:http'),os=require('node:os');
  const output=process.env.COIN_HOPPER_TEST_OUTPUT||path.join(os.tmpdir(),'coin-hopper-music-check');fs.mkdirSync(output,{recursive:true});
  const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end(fs.readFileSync(path.join(__dirname,'../index.html')));});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
  try{browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined)});console.log((await module.exports(browser,`http://127.0.0.1:${server.address().port}/`,output)).join('\n'));}
  finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
