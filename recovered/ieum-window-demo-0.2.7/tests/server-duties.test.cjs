'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),https=require('node:https'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {startServer}=require('../server/index.cjs');
test('duty imports validate atomically, isolate calendars, enforce manager permissions and replace assignments', {timeout:25000}, async()=>{
 const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'ieum-announcements-')),password=crypto.randomBytes(20).toString('hex');let server;
 async function request(route,payload,token){return new Promise((resolve,reject)=>{const body=payload===undefined?null:JSON.stringify(payload);const req=https.request(new URL(route,server.connection.url),{method:body?'POST':'GET',ca:server.connection.certificate,headers:{...(body?{'content-type':'application/json'}:{}),...(token?{authorization:'Bearer '+token}:{})}},res=>{let raw='';res.on('data',v=>raw+=v);res.on('end',()=>resolve({status:res.statusCode,...JSON.parse(raw)}));});req.on('error',reject);if(body)req.write(body);req.end();});}
 const sync=(token,operations)=>request('/sync',{operations},token),boot=token=>request('/bootstrap',undefined,token);
 try{
  server=await startServer({host:'127.0.0.1',port:0,address:'https://127.0.0.1:0',dataDir,admin:{username:'admin',password}});
  const admin=(await request('/login',{username:'admin',password})).token;
  const users=[];
  for(const [username,department] of [['manager','교무부'],['safety','생활안전부'],['alice','교무부'],['bob','교무부']]){
   const u=await request('/admin/users',{username,name:username,password,role:'교사',department},admin);assert.equal(u.status,201);
   const token=(await request('/login',{username,password})).token;await request('/password',{current:password,password:password+'x'},token);users.push({...u,token});
  }
  const [manager,safety,alice,bob]=users,config={safetyDepartment:'생활안전부',managers:{safety:[manager.id],lunch:[manager.id],study:[manager.id]}};
  assert.equal((await sync(alice.token,[{type:'duty.settings',value:config}])).status,403);
  assert.equal((await sync(admin,[{type:'duty.settings',value:config}])).status,200);
  const upload=rows=>[{type:'duty.import',value:{kind:'safety',rows}}],rows=[['날짜','生活安全','전체교사'],['2026-10-15','safety','alice'],['2026-10-16','safety','bob']];
  assert.equal((await sync(alice.token,upload(rows))).status,403);
  assert.equal((await sync(manager.token,upload([...rows,['2026-10-17','safety','unknown']]))).status,400);
  assert.equal((await boot(manager.token)).data.events.length,0,'invalid batch inserts nothing');
  assert.equal((await sync(manager.token,upload(rows))).status,200);
  assert.equal((await boot(manager.token)).data.events.length,2);assert.equal((await boot(safety.token)).data.events.length,2);
  assert.equal((await boot(alice.token)).data.events.length,1);assert.equal((await boot(bob.token)).data.events.length,1);
  assert.equal((await boot(admin)).data.events.length,0,'uploading/admin does not imply an assignment');
  const event=(await boot(alice.token)).data.events[0];assert.equal(event.start,'07:00');assert.equal(event.end,'08:00');assert.equal(event.readonly,true);assert.equal(event.canReschedule,false);
  for(const type of ['event.upsert','event.delete','event.reschedule'])assert.equal((await sync(manager.token,[{type,id:event.id,value:{...event,start:'08:00',end:'09:00'}}])).status,409);
  assert.equal((await sync(manager.token,upload(rows))).status,200);assert.equal((await boot(manager.token)).data.events.length,2);
  assert.equal((await sync(admin,upload([['2026-10-15','safety','bob']]))).status,200);
  assert.equal((await boot(alice.token)).data.events.length,0);assert.equal((await boot(bob.token)).data.events.length,2);
  const changed={...config,managers:{...config.managers,safety:[alice.id]}};
  assert.equal((await sync(admin,[{type:'duty.settings',value:changed}])).status,200);
  assert.equal((await boot(manager.token)).data.events.length,0);assert.equal((await boot(alice.token)).data.events.length,2);
  assert.equal((await sync(manager.token,upload(rows))).status,403);
  assert.deepEqual((await boot(alice.token)).data.dutySettings,changed);
  for(const [kind,start,end] of [['lunch','12:00','13:00'],['study','18:00','22:00']]){
   assert.equal((await sync(manager.token,[{type:'duty.import',value:{kind,rows:[['2026-10-18','alice']]}}])).status,200);
   const appointment=(await boot(alice.token)).data.events.find(e=>e.duty.kind===kind);assert.equal(appointment.start,start);assert.equal(appointment.end,end);
  }
  await server.close();server=await startServer({host:'127.0.0.1',port:0,address:'https://127.0.0.1:0',dataDir});
  const relogin=await request('/login',{username:'alice',password:password+'x'});
  assert.equal((await boot(relogin.token)).data.events.filter(e=>e.duty).length,4,'assignments persist through server restart');
  assert.deepEqual((await boot(relogin.token)).data.dutySettings,changed);
 }finally{if(server)await server.close();fs.rmSync(dataDir,{recursive:true,force:true});}
});
