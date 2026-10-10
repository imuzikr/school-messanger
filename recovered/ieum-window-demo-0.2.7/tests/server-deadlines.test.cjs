'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),https=require('node:https'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {startServer}=require('../server/index.cjs');const {sentDate}=require('../js/message-deadlines.js');
test('LAN send -> sender and recipient deadlines; atomic retry, deletion, restart, schedule and delayed delivery',async()=>{
 const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'ieum-deadlines-')),password=crypto.randomBytes(20).toString('hex');let server;
 const start=()=>startServer({host:'127.0.0.1',port:0,address:'https://127.0.0.1:0',dataDir,admin:{username:'admin',password}});
 async function request(route,payload,token){return new Promise((resolve,reject)=>{const body=payload===undefined?null:JSON.stringify(payload);const req=https.request(new URL(route,server.connection.url),{method:body?'POST':'GET',ca:server.connection.certificate,headers:{...(body?{'content-type':'application/json'}:{}),...(token?{authorization:'Bearer '+token}:{})}},res=>{let raw='';res.on('data',v=>raw+=v);res.on('end',()=>resolve({status:res.statusCode,...JSON.parse(raw)}));});req.on('error',reject);if(body)req.write(body);req.end();});}
 const sync=(token,operations)=>request('/sync',{operations},token);const boot=token=>request('/bootstrap',undefined,token);
 try{
  server=await start();let admin=(await request('/login',{username:'admin',password})).token;
  const r=await request('/admin/users',{username:'recipient',password,name:'수신자',department:'교무부'},admin);assert.equal(r.status,201);
  let recipient=(await request('/login',{username:'recipient',password})).token;
  assert.equal((await request('/password',{current:password,password:password+'x'},recipient)).status,200);
  const room={type:'room.create',id:'r-test',value:{name:'대화',members:[r.id]}};
  const msg={type:'message.send',id:'m-test',room:'r-test',value:{text:'내일까지 제출',createdAt:0}};
  assert.equal((await sync(admin,[room,msg])).status,200);
  let data=(await boot(recipient)).data;assert.equal(data.deadlines.length,1);assert.equal(data.deadlines[0].dueTime,'16:00');assert.ok(!('start' in data.deadlines[0]));
  const sent=data.rooms[0].messages[0].createdAt;assert.equal(data.deadlines[0].date,new Date(Date.parse(sentDate(sent)+'T00:00:00Z')+86400000).toISOString().slice(0,10));
  assert.equal((await boot(admin)).data.deadlines.length,1);
  await Promise.all([sync(admin,[msg]),sync(admin,[msg])]);assert.equal((await boot(recipient)).data.deadlines.length,1);
  await sync(recipient,[{type:'item.delete',id:data.deadlines[0].id}]);await sync(admin,[msg]);assert.equal((await boot(recipient)).data.deadlines.length,0);
  const mail={type:'mail.send',id:'mail-test',value:{title:'안내',body:'오전 중 제출',to:[r.id],files:[]}};
  assert.equal((await sync(admin,[mail])).status,200);data=(await boot(recipient)).data;assert.equal(data.deadlines[0].dueTime,'12:05');assert.equal(data.mails[0].eventId,data.deadlines[0].id);
  const periods=[{period:1,start:'08:30',end:'09:15'},{period:4,start:'11:00',end:'11:45'}];
  assert.equal((await sync(admin,[{type:'schedule.upsert',value:{date:data.deadlines[0].date,periods}}])).status,200);assert.equal((await boot(recipient)).data.deadlines[0].dueTime,'11:45');
  // Invalid batch rolls back message, ledger and deadline together.
  const rollback={...msg,id:'m-rollback'};assert.equal((await sync(admin,[rollback,{type:'invalid'}])).status,400);assert.equal((await boot(recipient)).data.deadlines.length,1);
  await sync(admin,[rollback]);assert.equal((await boot(recipient)).data.deadlines.length,2);
  const delayed={type:'mail.send',id:'mail-delayed',value:{title:'예약',body:'내일까지 14:00까지 제출',to:[r.id],files:[],scheduled:new Date(Date.now()+1500).toISOString()}};
  assert.equal((await sync(admin,[delayed])).status,200);assert.equal((await boot(recipient)).data.deadlines.length,2);
  await new Promise(resolve=>setTimeout(resolve,2600));data=(await boot(recipient)).data;assert.equal(data.deadlines.length,3);assert.equal(data.deadlines.find(d=>d.source.id==='mail-delayed').dueTime,'14:00');
  await server.close();server=await start();admin=(await request('/login',{username:'admin',password})).token;recipient=(await request('/login',{username:'recipient',password:password+'x'})).token;
  await sync(admin,[msg,mail,delayed]);assert.equal((await boot(recipient)).data.deadlines.length,3);
  const senderData=(await boot(admin)).data;assert.equal(senderData.deadlines.length,4);assert.equal(senderData.mails.find(m=>m.id==='mail-test').eventId,senderData.deadlines.find(d=>d.source.id==='mail-test').id);
  const privateId=(await boot(recipient)).data.deadlines[0].id;assert.equal((await sync(admin,[{type:'item.delete',id:privateId}])).status,403);
 }finally{if(server)await server.close();fs.rmSync(dataDir,{recursive:true,force:true});}
});
