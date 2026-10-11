'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),https=require('node:https'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {startServer}=require('../server/index.cjs');
const {recipients}=require('../js/announcements.js');
test('announcement audiences distinguish teachers, administrative staff and disabled accounts',()=>{
 const people=[{id:'a',role:'교사'},{id:'b',role:'부장'},{id:'c',role:'행정직원'},{id:'d',role:'교직원'},{id:'e',role:'교감'},{id:'f',role:'교사',disabled:true},{id:'g',role:'교무부장',department:'교무부'},{id:'h',role:'부장',department:'행정실'}];
 assert.deepEqual(recipients(people,'teachers'),['a','b','e','g']);assert.deepEqual(recipients(people,'staff'),['a','b','c','d','e','g','h']);assert.deepEqual(recipients(people,''),[]);
});
test('LAN announcements enforce full audience, preserve department, and deliver reserved calendars at dispatch', {timeout:25000}, async()=>{
 const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'ieum-announcements-')),password=crypto.randomBytes(20).toString('hex');let server;
 async function request(route,payload,token){return new Promise((resolve,reject)=>{const body=payload===undefined?null:JSON.stringify(payload);const req=https.request(new URL(route,server.connection.url),{method:body?'POST':'GET',ca:server.connection.certificate,headers:{...(body?{'content-type':'application/json'}:{}),...(token?{authorization:'Bearer '+token}:{})}},res=>{let raw='';res.on('data',v=>raw+=v);res.on('end',()=>resolve({status:res.statusCode,...JSON.parse(raw)}));});req.on('error',reject);if(body)req.write(body);req.end();});}
 const sync=(token,operations)=>request('/sync',{operations},token),boot=token=>request('/bootstrap',undefined,token);
 try{
  server=await startServer({host:'127.0.0.1',port:0,address:'https://127.0.0.1:0',dataDir,admin:{username:'admin',password}});
  const admin=(await request('/login',{username:'admin',password})).token;
  const users=[];
  for(const [username,role,department] of [['teacher','교사','교무부'],['head','부장','교무부'],['staff','행정직원','행정실'],['disabled','교사','교무부']]){
   const u=await request('/admin/users',{username,name:username,password,role,department},admin);assert.equal(u.status,201);
   const token=(await request('/login',{username,password})).token;assert.equal((await request('/password',{current:password,password:password+'x'},token)).status,200);users.push({...u,token});
  }
  assert.equal((await request('/admin/user',{id:users[3].id,disabled:true},admin)).status,200);
  const send=(id,audience,extra={})=>({type:'mail.send',id,value:{title:id,body:'학교 공지를 확인해 주세요.',to:[users[2].id],cc:[users[2].id],files:[],announcement:{audience,department:'교무부'},...extra}});
  assert.equal((await sync(admin,[send('teachers','teachers')])).status,200);
  const teacherMail=(await boot(users[0].token)).data.mails.find(m=>m.id==='teachers');assert.ok(teacherMail);assert.deepEqual(new Set(teacherMail.to),new Set([users[0].id,users[1].id]));assert.equal(teacherMail.announcement.department,'교무부');assert.deepEqual(teacherMail.cc,[]);assert.ok(!(await boot(users[2].token)).data.mails.some(m=>m.id==='teachers'));
  assert.equal((await sync(admin,[send('all','staff')])).status,200);const staffMail=(await boot(users[2].token)).data.mails.find(m=>m.id==='all');assert.equal(staffMail.to.length,4);assert.ok(!staffMail.to.includes(users[3].id));
  assert.equal((await sync(admin,[send('invalid','teachers',{announcement:{audience:'teachers',department:'없는 부서'}})])).status,400);
  const when=new Date(Date.now()+4000).toISOString(),event={type:'event.upsert',id:'reserved-event',value:{title:'교직원 모임',date:'2099-01-02',start:'10:00',end:'11:00',type:'group',place:'교무실',note:'공지 일정',targets:[users[2].id]}};
  assert.equal((await sync(admin,[event,send('reserved','teachers',{scheduled:when,calendarEvent:event.id})])).status,200);
  let data=(await boot(users[0].token)).data;assert.ok(!data.mails.some(m=>m.id==='reserved'));assert.ok(!data.events.some(e=>e.id===event.id));
  assert.ok((await boot(admin)).data.events.some(e=>e.id===event.id));
  const deadline=Date.now()+8000;
  do{await new Promise(resolve=>setTimeout(resolve,250));data=(await boot(users[0].token)).data;}while(!data.mails.some(m=>m.id==='reserved')&&Date.now()<deadline);
  assert.ok(data.mails.some(m=>m.id==='reserved'));const shared=data.events.find(e=>e.id===event.id);assert.ok(shared);assert.deepEqual(new Set(shared.targets),new Set([users[0].id,users[1].id]));assert.ok(!(await boot(users[2].token)).data.events.some(e=>e.id===event.id));
  assert.equal((await sync(admin,[send('reserved','teachers',{scheduled:when,calendarEvent:event.id})])).status,200);assert.equal((await boot(users[0].token)).data.mails.filter(m=>m.id==='reserved').length,1);
  assert.equal((await sync(admin,[{type:'mail.update',id:'reserved',recall:true}])).status,200);assert.ok(!(await boot(users[0].token)).data.events.some(e=>e.id===event.id));
 }finally{if(server)await server.close();fs.rmSync(dataDir,{recursive:true,force:true});}
});
