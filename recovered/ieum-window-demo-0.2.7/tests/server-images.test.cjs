'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),https=require('node:https'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {startServer}=require('../server/index.cjs');
test('inline images survive LAN delivery above the old HTML limit and share the attachment budget',async()=>{
 const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'ieum-images-')),password=crypto.randomBytes(20).toString('hex');let server;
 const request=(route,payload,token)=>new Promise((resolve,reject)=>{const body=payload===undefined?null:JSON.stringify(payload);const req=https.request(new URL(route,server.connection.url),{method:body?'POST':'GET',ca:server.connection.certificate,headers:{...(body?{'content-type':'application/json'}:{}),...(token?{authorization:'Bearer '+token}:{})}},res=>{let raw='';res.on('data',v=>raw+=v);res.on('end',()=>resolve({status:res.statusCode,...JSON.parse(raw)}));});req.on('error',reject);if(body)req.write(body);req.end();});
 try{
  server=await startServer({host:'127.0.0.1',port:0,address:'https://127.0.0.1:0',dataDir,admin:{username:'admin',password}});
  const admin=(await request('/login',{username:'admin',password})).token;
  const u=await request('/admin/users',{username:'teacher',name:'교사',password,role:'교사',department:'교무부'},admin),token=(await request('/login',{username:'teacher',password})).token;await request('/password',{current:password,password:password+'x'},token);
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==','base64');
  const data=n=>'data:image/png;base64,'+Buffer.concat([png,Buffer.alloc(n-png.length)]).toString('base64');
  const html='<img src="'+data(200000)+'" alt="캡처 이미지">';
  const send=(id,html,files=[])=>request('/sync',{operations:[{type:'mail.send',id,value:{to:[u.id],cc:[],title:'',body:'[이미지]',html,files}}]},admin);
  assert.equal((await send('image-mail',html)).status,200);const mail=(await request('/bootstrap',undefined,token)).data.mails.find(m=>m.id==='image-mail');assert.equal(mail.inlineStored,true);assert.ok(mail.html.length<100);assert.equal((await request("/attachment",{mail:"image-mail",inline:true},token)).html,html);assert.equal(mail.body,'[이미지]');
  assert.equal((await request("/attachment",{mail:"image-mail",inline:true},undefined)).status,401);
  const big=data(2*1024*1024),pair='<img src="'+big+'"><img src="'+big+'">';assert.equal((await send('too-many-images',pair)).status,413);
  assert.equal((await send('mixed-budget','<img src="'+big+'">',[{name:'capture.png',data:big}])).status,413);
  assert.ok(!(await request('/bootstrap',undefined,token)).data.mails.some(m=>m.id==='mixed-budget'));
 }finally{if(server)await server.close();fs.rmSync(dataDir,{recursive:true,force:true});}
});
