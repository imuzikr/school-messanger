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
  const training={type:'message.send',id:'m-training',room:'r-test',value:{text:'내일 1시에서 3시까지 교직원 연수가 있습니다.'}};
  await sync(admin,[training]);await sync(admin,[training]);for(const token of [admin,recipient]){const data=(await boot(token)).data;const e=data.events.filter(e=>e.source?.id==='m-training');assert.equal(e.length,1);assert.equal(e[0].start,'13:00');assert.equal(e[0].end,'15:00');assert.ok(!data.deadlines.some(d=>d.source?.id==='m-training'));}
  const event=(await boot(recipient)).data.events.find(e=>e.source?.id==='m-training');await sync(recipient,[{type:'event.delete',id:event.id}]);await sync(admin,[training]);assert.ok(!(await boot(recipient)).data.events.some(e=>e.source?.id==='m-training'));
  const text='오늘 6시에 교무실로 모여주세요',single={type:'mail.send',id:'mail-start',value:{title:text,body:text,to:[r.id],files:[]}};
  await sync(admin,[single]);await sync(admin,[single]);
  for(const token of [admin,recipient]){const d=(await boot(token)).data,e=d.events.filter(e=>e.source?.id==='mail-start');assert.equal(e.length,1);assert.equal(e[0].start,'18:00');assert.equal(e[0].end,'19:00');assert.ok(!d.deadlines.some(d=>d.source?.id==='mail-start'));}
  const periodDate=(await boot(admin)).data.today;
  await sync(admin,[{type:'schedule.upsert',value:{date:periodDate,periods:[{period:5,start:'13:10',end:'13:55'},{period:7,start:'15:10',end:'15:55'}]}}]);
  const periodText='오늘 5교시에 3층 모둠교실로 모여주세요.',periodMail={type:'mail.send',id:'mail-period',value:{title:periodText,body:periodText,to:[r.id],files:[]}};
  assert.equal((await sync(admin,[periodMail])).status,200);await sync(admin,[periodMail]);
  for(const token of [admin,recipient]){const data=(await boot(token)).data,events=data.events.filter(e=>e.source?.id==='mail-period');assert.equal(events.length,1);assert.deepEqual([events[0].start,events[0].end,events[0].place],['13:10','13:55','3층 모둠교실']);assert.equal(data.mails.find(m=>m.id==='mail-period').eventId,events[0].id);}
  const sevenText='오늘 7교시에 3층으로 오세요.',sevenMail={type:'mail.send',id:'mail-seven',value:{title:sevenText,body:sevenText,to:[r.id],files:[]}};assert.equal((await sync(admin,[sevenMail])).status,200);await sync(admin,[sevenMail]);for(const token of [admin,recipient]){const data=(await boot(token)).data,e=data.events.filter(e=>e.source?.id==='mail-seven');assert.equal(e.length,1);assert.deepEqual([e[0].start,e[0].end,e[0].place],['15:10','15:55','3층']);assert.equal(data.mails.find(m=>m.id==='mail-seven').eventId,e[0].id);}
  const singleEvent=(await boot(recipient)).data.events.find(e=>e.source?.id==='mail-start');await sync(recipient,[{type:'event.delete',id:singleEvent.id}]);
  const senderEvent=(await boot(admin)).data.events.find(e=>e.source?.id==='mail-start');
  const senderPeriod=(await boot(admin)).data.events.find(e=>e.source?.id==='mail-seven');
  await server.close();server=null;
  // Simulate an older version that saved the mail but could not extract its start time.
  const fixture=new (require('node:sqlite').DatabaseSync)(path.join(dataDir,'ieum.sqlite'));
  fixture.prepare('DELETE FROM events WHERE id=?').run(senderPeriod.id);fixture.prepare('DELETE FROM auto_deadline_sources WHERE item_id=?').run(senderPeriod.id);fixture.prepare('DELETE FROM events WHERE id=?').run(senderEvent.id);fixture.prepare('DELETE FROM auto_deadline_sources WHERE item_id=?').run(senderEvent.id);fixture.close();
  server=await start();admin=(await request('/login',{username:'admin',password})).token;recipient=(await request('/login',{username:'recipient',password:password+'x'})).token;
  const backfilled=(await boot(admin)).data.events.filter(e=>e.source?.id==='mail-seven');assert.equal(backfilled.length,1);assert.deepEqual([backfilled[0].start,backfilled[0].end,backfilled[0].place],['15:10','15:55','3층']);
  assert.equal((await boot(admin)).data.events.filter(e=>e.source?.id==='mail-start').length,1);assert.equal((await boot(recipient)).data.events.filter(e=>e.source?.id==='mail-start').length,0);
  const privateId=(await boot(recipient)).data.deadlines[0].id;assert.equal((await sync(admin,[{type:'item.delete',id:privateId}])).status,403);

  const ccUser=await request('/admin/users',{username:'cc',password,name:'참조',department:'교무부'},admin),outside=await request('/admin/users',{username:'outside',password,name:'외부 참여자',department:'행정실'},admin);
  const ccToken=(await request('/login',{username:'cc',password})).token,outToken=(await request('/login',{username:'outside',password})).token;
  await request('/password',{current:password,password:password+'y'},ccToken);await request('/password',{current:password,password:password+'z'},outToken);
  const sharedMail={type:'mail.send',id:'mail-resize',value:{title:'공유 일정',body:'내일 오후 1시부터 2시까지 회의. 내일 오후 3시부터 4시까지 회의.',to:[r.id],cc:[ccUser.id],files:[]}};
  assert.equal((await sync(admin,[sharedMail])).status,200);
  const allTokens=[admin,recipient,ccToken],bySource=async token=>(await boot(token)).data.events.filter(e=>e.source?.id==='mail-resize');
  for(const token of allTokens)assert.equal((await bySource(token)).length,2);
  const ccEvent=(await bySource(ccToken)).find(e=>e.start==='13:00'),newDate='2026-10-16';
  assert.equal((await sync(ccToken,[{type:'event.reschedule',id:ccEvent.id,value:{date:newDate,start:'06:30',end:'08:00'}}])).status,200);
  for(const token of allTokens){const events=await bySource(token);assert.ok(events.some(e=>e.date===newDate&&e.start==='06:30'&&e.end==='08:00'));assert.ok(events.some(e=>e.start==='15:00'&&e.end==='16:00'));}
  assert.equal((await sync(outToken,[{type:'event.reschedule',id:ccEvent.id,value:{date:newDate,start:'09:00',end:'10:00'}}])).status,403);
  assert.equal((await sync(ccToken,[{type:'event.reschedule',id:ccEvent.id,value:{date:newDate,start:'10:00',end:'09:00'}}])).status,400);
  assert.equal((await sync(ccToken,[{type:'event.reschedule',id:ccEvent.id,value:{date:newDate,start:'09:00',end:'10:00'}},{type:'invalid'}])).status,400);
  assert.equal((await bySource(admin)).find(e=>e.date===newDate).start,'06:30');
  const recipientCopy=(await bySource(recipient)).find(e=>e.date===newDate);await sync(recipient,[{type:'event.delete',id:recipientCopy.id}]);
  await sync(admin,[{type:'event.reschedule',id:(await bySource(admin)).find(e=>e.date===newDate).id,value:{date:newDate,start:'19:00',end:'20:30'}}]);assert.equal((await bySource(recipient)).length,1);
  for(const [id,start,end] of [['event-late','23:00','23:15'],['event-early','06:30','07:30']]){
    const value={id,title:id,date:newDate,start,end,type:'personal',targets:[],place:'',note:''};
    assert.equal((await sync(admin,[{type:'event.upsert',value}])).status,200);
    assert.equal((await boot(admin)).data.events.find(e=>e.id===id).start,start);
    for(const [badStart,badEnd] of [['23:15','23:00'],['24:00','24:15'],['06:70','07:30']])assert.equal((await sync(admin,[{type:'event.upsert',value:{...value,start:badStart,end:badEnd}}])).status,400);
    assert.equal((await boot(admin)).data.events.find(e=>e.id===id).start,start);
  }
  const central={id:'event-central',title:'직접 공유',date:newDate,start:'09:00',end:'10:00',type:'group',targets:[r.id,ccUser.id],place:'',note:''};assert.equal((await sync(admin,[{type:'event.upsert',value:central}])).status,200);
  const sharedCalendarMail={type:'mail.send',id:'mail-central',value:{title:'직접 공유',body:'협의회 자료를 준비해 주세요.\n일정: '+newDate+' 09:00–10:00',to:central.targets,cc:[],files:[],calendarEvent:central.id,eventId:central.id}};
  assert.equal((await sync(admin,[sharedCalendarMail])).status,200);assert.equal((await sync(admin,[sharedCalendarMail])).status,200);
  for(const token of allTokens){const data=(await boot(token)).data;const messages=data.mails.filter(m=>m.id==='mail-central');assert.equal(messages.length,1);assert.equal(messages[0].eventId,central.id);assert.ok(messages[0].body.includes('협의회 자료'));assert.equal(data.events.filter(e=>e.id===central.id).length,1);assert.ok(!data.events.some(e=>e.source?.id==='mail-central'));}
  assert.equal((await boot(recipient)).data.events.find(e=>e.id===central.id).canReschedule,true);
  assert.equal((await sync(recipient,[{type:'event.reschedule',id:central.id,value:{date:newDate,start:'11:00',end:'12:15'}}])).status,200);
  for(const token of allTokens)assert.equal((await boot(token)).data.events.find(e=>e.id===central.id).end,'12:15');
  assert.equal((await sync(outToken,[{type:'event.reschedule',id:central.id,value:{date:newDate,start:'11:00',end:'12:00'}}])).status,403);
  const dueMail={type:'mail.send',id:'mail-move-due',value:{title:'기한 공유',body:'내일 점심시간 전까지 제출',to:[r.id],cc:[ccUser.id],files:[]}};await sync(admin,[dueMail]);
  const due=(await boot(ccToken)).data.deadlines.find(d=>d.source?.id===dueMail.id);assert.equal((await sync(ccToken,[{type:'deadline.reschedule',id:due.id,value:{date:newDate,dueTime:'17:15'}}])).status,200);
  for(const token of allTokens){const d=(await boot(token)).data.deadlines.find(d=>d.source?.id===dueMail.id);assert.equal(d.date,newDate);assert.equal(d.dueTime,'17:15');assert.equal(d.rule,'explicit');assert.ok(d.source);}
  await server.close();server=await start();admin=(await request('/login',{username:'admin',password})).token;recipient=(await request('/login',{username:'recipient',password:password+'x'})).token;
  assert.equal((await bySource(admin)).find(e=>e.date===newDate).start,'19:00');assert.equal((await bySource(recipient)).length,1);

  const mixed={type:'mail.send',id:'mail-maintenance-mixed',value:{title:'일정 안내',body:'금요일 16시부터 18시까지 전체 소독이 있습니다.\n금요일 10시부터 11시까지 회의가 있습니다.',to:[r.id],files:[]}};
  assert.equal((await sync(admin,[mixed])).status,200);const oldCopies=(await boot(admin)).data.events.filter(e=>e.source?.id===mixed.id),missed=oldCopies.find(e=>e.start==='16:00');assert.equal(oldCopies.length,2);
  await server.close();server=null;const oldDb=new (require('node:sqlite').DatabaseSync)(path.join(dataDir,'ieum.sqlite')),owner=oldDb.prepare('SELECT owner FROM events WHERE id=?').get(missed.id).owner;
  oldDb.prepare('DELETE FROM events WHERE id=?').run(missed.id);oldDb.prepare('DELETE FROM auto_deadline_sources WHERE item_id=?').run(missed.id);
  oldDb.prepare('INSERT INTO items VALUES(?,?,?,?)').run('old-sanitation-due',owner,'deadlines',JSON.stringify({title:missed.title,note:missed.note,date:missed.date,dueTime:'18:00',rule:'explicit',source:{kind:'mail',id:mixed.id}}));
  oldDb.prepare('INSERT INTO auto_deadline_sources VALUES(?,?)').run(JSON.stringify(['mail',mixed.id,owner,0]),'old-sanitation-due');oldDb.close();
  server=await start();admin=(await request('/login',{username:'admin',password})).token;recipient=(await request('/login',{username:'recipient',password:password+'x'})).token;
  const restored=(await boot(admin)).data;assert.deepEqual(restored.events.filter(e=>e.source?.id===mixed.id).map(e=>e.start).sort(),['10:00','16:00']);assert.ok(!restored.deadlines.some(e=>e.id==='old-sanitation-due'));

  const sanitationText='금요일 16시에 전체 소독이 있습니다.',sanitation={type:'mail.send',id:'mail-sanitation',value:{title:sanitationText,body:sanitationText,to:[r.id],files:[]}},sanitationChat={type:'message.send',id:'chat-sanitation',room:'r-test',value:{text:sanitationText}};
  assert.equal((await sync(admin,[sanitation,sanitationChat])).status,200);await sync(admin,[sanitation,sanitationChat]);
  const sanity=async token=>{const data=(await boot(token)).data;for(const source of ['mail-sanitation','chat-sanitation']){const events=data.events.filter(e=>e.source?.id===source);assert.equal(events.length,1);assert.deepEqual([events[0].start,events[0].end],['16:00','17:00']);assert.equal(new Date(events[0].date+'T00:00:00Z').getUTCDay(),5);assert.ok(!data.deadlines.some(d=>d.source?.id===source));}return data;};
  await sanity(admin);await sanity(recipient);
  const sanitationRecipient=(await sanity(recipient)).events.find(e=>e.source?.id==='mail-sanitation');await sync(recipient,[{type:'event.delete',id:sanitationRecipient.id}]);
  await server.close();server=await start();admin=(await request('/login',{username:'admin',password})).token;recipient=(await request('/login',{username:'recipient',password:password+'x'})).token;
  await sanity(admin);assert.equal((await boot(recipient)).data.events.filter(e=>e.source?.id==='mail-sanitation').length,0,'deleted sanitation appointments stay deleted on backfill');

  // Related source remains available beyond bootstrap's latest-500 window, only to room members.
  const oldSource=await request('/message-source',{id:'m-test'},recipient);
  assert.equal(oldSource.status,200);assert.equal(oldSource.message.text,'내일까지 제출');assert.equal(oldSource.room,'r-test');
  assert.equal((await request('/message-source',{id:'m-test'},outToken)).status,403);
  assert.equal((await request('/message-source',{id:'missing'},recipient)).status,404);
  const fillers=Array.from({length:501},(_,i)=>({type:'message.send',id:'history-'+i,room:'r-test',value:{text:'일반 대화 '+i}}));
  await sync(admin,fillers.slice(0,300));await sync(admin,fillers.slice(300));
  assert.ok(!(await boot(recipient)).data.rooms.find(r=>r.id==='r-test').messages.some(m=>m.id==='m-test'));
  assert.equal((await request('/message-source',{id:'m-test'},recipient)).message.text,'내일까지 제출');
 }finally{if(server)await server.close();fs.rmSync(dataDir,{recursive:true,force:true});}
});
