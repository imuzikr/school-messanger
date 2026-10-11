'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),https=require('node:https'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {startServer}=require('../server/index.cjs');
test('dated bell schedule: custom broadcast title, next-day defaults, migration, atomic retry and restart',async()=>{
 const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'ieum-bell-')),password=crypto.randomBytes(20).toString('hex');let server;
 const legacy=new (require('node:sqlite').DatabaseSync)(path.join(dataDir,'ieum.sqlite'));legacy.exec('CREATE TABLE bell_schedules(date TEXT PRIMARY KEY,periods TEXT NOT NULL)');legacy.prepare('INSERT INTO bell_schedules VALUES(?,?)').run('2026-10-09',JSON.stringify([{period:1,start:'08:00',end:'08:50'}]));legacy.close();
 const start=()=>startServer({host:'127.0.0.1',port:0,address:'https://127.0.0.1:0',dataDir,admin:{username:'admin',password}});
 const request=(route,payload,token)=>new Promise((resolve,reject)=>{const body=payload===undefined?null:JSON.stringify(payload),req=https.request(new URL(route,server.connection.url),{method:body?'POST':'GET',ca:server.connection.certificate,headers:{...(body?{'content-type':'application/json'}:{}),...(token?{authorization:'Bearer '+token}:{})}},res=>{let raw='';res.on('data',v=>raw+=v);res.on('end',()=>resolve({status:res.statusCode,...JSON.parse(raw)}));});req.on('error',reject);if(body)req.write(body);req.end();});
 const sync=(token,operations)=>request('/sync',{operations},token),boot=token=>request('/bootstrap',undefined,token);
 try{
  server=await start();let admin=(await request('/login',{username:'admin',password})).token;const ids=[],tokens=[];
  for(const username of ['a','b']){const r=await request('/admin/users',{username,password,name:username,department:'교무부'},admin);assert.equal(r.status,201);ids.push(r.id);const token=(await request('/login',{username,password})).token;await request('/password',{current:password,password:password+'x'},token);tokens.push(token);}
  assert.equal((await boot(admin)).data.bellSchedules.find(s=>s.date==='2026-10-09').periods[0].start,'08:00');
  const baseline=[{period:1,start:'08:10',end:'09:00'},{period:4,start:'11:10',end:'12:00'}],temporary=[{period:1,start:'08:30',end:'09:20'},{period:4,start:'11:30',end:'12:20'}],date='2026-10-16',title='체육대회 단축 수업 안내';
  assert.equal((await sync(admin,[{type:'schedule.upsert',value:{periods:baseline}}])).status,200);
  const batch=[{type:'schedule.upsert',value:{date,title,periods:temporary}},{type:'mail.send',id:'bell-notice',value:{title,body:'client content',scheduleAnnouncement:{date,scope:'temporary'},to:[],files:[]}}];
  assert.equal((await sync(admin,[...batch,{type:'invalid'}])).status,400);assert.ok(!(await boot(admin)).data.bellSchedules.some(s=>s.date===date));
  assert.equal((await sync(admin,batch)).status,200);assert.equal((await sync(admin,batch)).status,200);
  for(const token of [admin,...tokens]){const d=(await boot(token)).data,m=d.mails.filter(m=>m.id==='bell-notice');assert.equal(m.length,1);assert.equal(m[0].title,title);assert.ok(m[0].body.includes(date));assert.ok(m[0].html.includes(date));assert.ok(m[0].html.includes('다음 날'));assert.ok(m[0].body.includes('12:20'));assert.ok(m[0].body.includes('다음 날'));assert.equal(d.bellSchedules.find(s=>s.date===date).title,title);assert.deepEqual(d.defaultPeriods,baseline);}
  const notices=[date,'2026-10-17'].map((date,i)=>({type:'mail.send',id:'makeup-bell-'+i,value:{title:'보강 안내',body:'수업 안내',to:ids,files:[],notice:{kind:'makeup',date,rows:[{period:4,teacher:ids[0],className:''}]}}}));assert.equal((await sync(admin,notices)).status,200);
  for(const token of [admin,tokens[0]]){const d=(await boot(token)).data;assert.equal(d.events.find(e=>e.noticeMail==='makeup-bell-0').end,'12:20');assert.equal(d.events.find(e=>e.noticeMail==='makeup-bell-1').end,'12:00');}
  assert.equal((await sync(tokens[0],[{type:'schedule.upsert',value:{date,title,periods:baseline}}])).status,403);
  await server.close();server=await start();admin=(await request('/login',{username:'admin',password})).token;const d=(await boot(admin)).data;assert.deepEqual(d.defaultPeriods,baseline);assert.deepEqual(d.bellSchedules.find(s=>s.date===date),{date,title,periods:temporary});assert.equal(d.events.find(e=>e.noticeMail==='makeup-bell-1').end,'12:00');
  const generated=require('../js/bell-schedule.js').generate({start:'08:00',duration:40,count:6,lunchStart:'10:30',lunchEnd:'11:30'}),mailCount=(await boot(admin)).data.mails.length;
  assert.equal((await sync(admin,[{type:'schedule.upsert',value:{periods:generated}}])).status,200);const generatedData=(await boot(admin)).data;assert.deepEqual(generatedData.defaultPeriods,generated);assert.equal(generatedData.mails.length,mailCount);assert.equal(generatedData.events.find(e=>e.noticeMail==='makeup-bell-1').start,'11:30');assert.deepEqual(generatedData.bellSchedules.find(s=>s.date===date).periods,temporary);
 }finally{if(server)await server.close();fs.rmSync(dataDir,{recursive:true,force:true});}
});
