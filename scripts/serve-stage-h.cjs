// Local owner playtest helper. Nothing starts until the owner runs this file.
// --lan explicitly permits same-network phones; default binds loopback only.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os'),{parseArgs}=require('node:util');
const {values}=parseArgs({options:{lan:{type:'boolean',default:false},port:{type:'string',default:'8080'}}});
const port=Number(values.port);if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Use a port from 1024 to 65535.');
const root=fs.existsSync(path.join(__dirname,'index.html'))?__dirname:path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'));
const server=http.createServer((request,response)=>{
 if(!['GET','HEAD'].includes(request.method)){response.writeHead(405);return response.end();}
 const pathname=new URL(request.url,'http://localhost').pathname;
 if(pathname==='/favicon.ico'){response.writeHead(204);return response.end();}
 if(!['/','/index.html'].includes(pathname)){response.writeHead(404);return response.end('Not found');}
 response.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});response.end(request.method==='HEAD'?undefined:html);
});
server.listen(port,values.lan?'0.0.0.0':'127.0.0.1',()=>{
 console.log(`Coin Hopper owner test: http://127.0.0.1:${port}/ — Ctrl+C stops.`);
 if(values.lan)for(const interfaces of Object.values(os.networkInterfaces()))for(const address of interfaces||[])if(address.family==='IPv4'&&!address.internal)console.log(`Same-Wi-Fi phone URL: http://${address.address}:${port}/`);
});
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
