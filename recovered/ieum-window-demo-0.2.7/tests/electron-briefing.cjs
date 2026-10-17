'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{PNG}=require('pngjs');
const {_electron}=require('playwright');
(async()=>{const data=fs.mkdtempSync(path.join(os.tmpdir(),'ieum-briefing-'));let app;
try{
 const executable=process.env.IEUM_TEST_EXECUTABLE||require('electron');
 app=await _electron.launch({executablePath:executable,args:['--no-sandbox','--disable-gpu',...(process.env.IEUM_TEST_EXECUTABLE?[]:[path.resolve(__dirname,'..')])],env:{...process.env,DISPLAY:process.env.DISPLAY||':99',IEUM_ROLE:'demo',IEUM_TEST_DATA_DIR:data},timeout:30000});
 const p=await app.firstWindow();await p.locator('.briefing-modal').waitFor();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const fixture=await p.evaluate(()=>{
  const s=JSON.parse(localStorage.getItem('ieum-v1')),day=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date()),person=s.data.people[0].id,room=s.data.rooms[0];
  s.data.mails=[{id:'user-brief-mail',from:person,to:['me'],cc:[],title:'브리핑 원본 안내',body:'회의 자료를 확인해 주세요.',html:'<p>회의 자료를 확인해 주세요.</p>',folder:'inbox',date:day,time:'09:00',unread:true,important:false,files:[],receipts:['unread']}];
  room.messages.push({id:'user-brief-chat',sender:person,text:'브리핑에서 찾아온 원본 대화',date:day,time:'09:00',likes:0});
  const common={date:day,start:'09:00',end:'10:00',place:'교무실',note:'자료 확인',type:'group',targets:['me']};
  s.data.events=[{...common,id:'user-brief-event',title:'회의 안내',source:{kind:'mail',id:'user-brief-mail'}},{...common,id:'user-brief-message-event',title:'대화 안내',source:{kind:'message',id:'user-brief-chat'}},{...common,id:'user-brief-personal',title:'개인 일정',type:'personal',targets:[],note:''}];
  s.data.deadlines=[{id:'user-brief-deadline',title:'자료 제출',date:day,dueTime:'11:00',done:false,source:{kind:'mail',id:'user-brief-mail'}}];
  s.data.tasks=[{id:'user-brief-task-linked',title:'안내 확인',done:false,source:{kind:'mail',id:'user-brief-mail'}},{id:'user-brief-task',title:'직접 등록한 할 일',done:false}];
  localStorage.setItem('ieum-v1',JSON.stringify(s));
  return {room:room.id,day};
 });
 await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0],original=w.setShape.bind(w);w.setShape=region=>{w.testShape=region;return original(region);};});
 const reopen=async()=>{await p.evaluate(()=>{for(const key of Object.keys(sessionStorage))if(key.startsWith('ieum-briefing:'))sessionStorage.removeItem(key);});await p.reload();await p.locator('.briefing-modal').waitFor();};
 await reopen();
 const assertSurface=async()=>{
  const state=await p.evaluate(()=>{const overlay=document.querySelector('.briefing-overlay'),modal=overlay.querySelector('.modal'),r=modal.getBoundingClientRect();return {background:getComputedStyle(overlay).backgroundColor,blur:getComputedStyle(overlay).backdropFilter,app:getComputedStyle(document.querySelector('#app')).visibility,rect:{x:Math.floor(r.x),y:Math.floor(r.y),width:Math.ceil(r.width),height:Math.ceil(r.height)}};});
  assert.equal(state.background,'rgba(0, 0, 0, 0)');assert.equal(state.blur,'none');assert.equal(state.app,'hidden');
  let shape;for(let n=0;n<40;n++){shape=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].testShape);if(JSON.stringify(shape)===JSON.stringify([state.rect]))break;await p.waitForTimeout(25);}
  assert.deepEqual(shape,[state.rect]);
  const png=PNG.sync.read(await p.screenshot({omitBackground:true}));
  const sample=(x,y)=>png.data[(Math.max(0,Math.min(png.height-1,y))*png.width+Math.max(0,Math.min(png.width-1,x)))*4+3];
  assert.equal(sample(state.rect.x+Math.floor(state.rect.width/2),Math.max(0,state.rect.y-3)),0,'no painted panel above briefing');
  assert.equal(sample(Math.max(0,state.rect.x-3),state.rect.y+Math.floor(state.rect.height/2)),0,'no painted panel beside briefing');
 };
 await assertSurface();
 await p.waitForFunction(()=>document.activeElement?.matches('.briefing-modal'));
 const closeStyle=selector=>p.locator(selector).evaluate(el=>{const s=getComputedStyle(el);return {border:s.borderWidth,radius:s.borderRadius,outline:s.outlineWidth,outlineStyle:s.outlineStyle,offset:s.outlineOffset};});
 const closeSelector='.briefing-modal .modal-head [data-action=close-modal]';
 assert.equal((await closeStyle(closeSelector)).border,'0px');assert.equal((await closeStyle(closeSelector)).outlineStyle,'none','opening dialog does not auto-outline close icon');
 await p.keyboard.press('Tab');assert.equal(await p.locator(closeSelector).evaluate(el=>el===document.activeElement),true);const focusedClose=await closeStyle(closeSelector);assert.equal(focusedClose.outline,'1px');assert.equal(focusedClose.offset,'-3px');assert.equal(focusedClose.radius,'6px');await p.keyboard.press('Enter');await p.locator('.briefing-modal').waitFor({state:'detached'});
 const hostClose='.compact-window-controls [data-action=window-close]';await p.locator(hostClose).focus();assert.deepEqual(await closeStyle(hostClose),focusedClose,'messenger and modal close icon borders and keyboard rings match');await reopen();await assertSurface();
 const dragRegions=await p.evaluate(()=>({header:getComputedStyle(document.querySelector('.briefing-modal .modal-head')).webkitAppRegion,close:getComputedStyle(document.querySelector('.briefing-modal .modal-head button')).webkitAppRegion,entry:getComputedStyle(document.querySelector('.briefing-entry')).webkitAppRegion}));
 assert.deepEqual(dragRegions,{header:'drag',close:'no-drag',entry:'no-drag'});
 await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0],b=w.getBounds();w.setPosition(b.x+30,b.y+20);});
 await assertSurface();
 for(const side of ['right','left']){await p.evaluate(side=>window.ieumDesktop.toggleToday(true,side),side);await p.waitForFunction(side=>document.body.dataset.hostSide===side,side);await assertSurface();}
 fs.mkdirSync(path.resolve(__dirname,'../release'),{recursive:true});await p.screenshot({path:path.resolve(__dirname,'../release/briefing-card-0.2.60.png'),omitBackground:true});
 const openMail=async(kind,id,reuse)=>{
  let inbox;
  if(!reuse){const opened=app.waitForEvent('window');await p.locator('.briefing-entry[data-kind="'+kind+'"][data-item="'+id+'"]').click();inbox=await opened;}
  else {await p.locator('.briefing-entry[data-kind="'+kind+'"][data-item="'+id+'"]').focus();await p.keyboard.press('Enter');inbox=reuse;}
  await p.locator('.briefing-modal').waitFor({state:'detached'});await inbox.locator('.mail-body').waitFor();assert.ok((await inbox.locator('.mail-body').innerText()).includes('회의 자료를 확인해 주세요.'));
  assert.equal(await inbox.locator('.mail-table-row.active').getAttribute('data-mail'),'user-brief-mail');return inbox;
 };
 const inbox=await openMail('event','user-brief-event');
 await reopen();await inbox.locator('#mail-search').fill('일치하지 않는 검색');const count=(await app.windows()).length;await openMail('deadline','user-brief-deadline',inbox);assert.equal((await app.windows()).length,count);assert.equal(await inbox.locator('#mail-search').inputValue(),'');
 await reopen();await openMail('task','user-brief-task-linked',inbox);
 await reopen();const chatOpened=app.waitForEvent('window');await p.locator('.briefing-entry[data-item="user-brief-message-event"]').click();const chat=await chatOpened;await chat.locator('article.briefing-target[data-message="user-brief-chat"]').waitFor();assert.ok((await chat.locator('article.briefing-target').innerText()).includes('원본 대화'));assert.equal(await p.locator('.briefing-modal').count(),0);
 await reopen();const calOpened=app.waitForEvent('window');await p.locator('.briefing-entry[data-item="user-brief-personal"]').click();const calendar=await calOpened;await calendar.locator('.schedule-detail-modal').waitFor();assert.equal(await p.locator('.briefing-modal').count(),0);await calendar.locator('.modal-head [data-action=close-modal]').click();
 await reopen();await p.locator('.briefing-entry[data-item="user-brief-task"]').click();await calendar.locator('.task-row.briefing-target').waitFor();assert.equal(await calendar.locator('input[data-task="user-brief-task"]').isChecked(),false);assert.equal(await p.locator('.briefing-modal').count(),0);
 assert.equal(await p.locator('#app').evaluate(el=>getComputedStyle(el).visibility),'visible');
 assert.deepEqual(errors,[]);
 console.log('PASS: transparent card-only pixels and native shape on both sides; restore host; event/deadline/task -> actual mail, reused inbox and cleared filters; keyboard activation; original chat scroll/highlight; manual items show details without toggling completion.');
}finally{if(app)await app.close();fs.rmSync(data,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1});
