'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{_electron}=require('playwright');
(async()=>{const data=fs.mkdtempSync(path.join(os.tmpdir(),'ieum-duty-drag-'));let app;
try{
 app=await _electron.launch({executablePath:process.env.IEUM_TEST_EXECUTABLE||require('electron'),args:['--no-sandbox','--disable-gpu','--user-data-dir='+data,...(process.env.IEUM_TEST_EXECUTABLE?[]:[path.resolve(__dirname,'..')])],env:{...process.env,DISPLAY:process.env.DISPLAY||':99',IEUM_ROLE:'demo'},timeout:30000});
 assert.equal(path.resolve(await app.evaluate(({app})=>app.getPath('userData'))),path.resolve(data),'packaged and source tests use an isolated Chromium profile');
 const main=await app.firstWindow();await require('./electron-helpers.cjs').dismissBriefing(main);const opened=app.waitForEvent('window');await main.locator('.rail [data-action=nav-calendar]').click();const page=await opened;await page.locator('.hours[data-calendar-timeline]').first().waitFor();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const dates=await page.locator('.hours[data-calendar-timeline]').evaluateAll(els=>els.map(e=>e.dataset.calendarTimeline));
 await page.evaluate(dates=>{const s=JSON.parse(localStorage.getItem('ieum-v1')),teacher=s.data.people[0].id;for(const [id,start,end,kind] of [['user-drag-normal','09:00','10:00',null],['duty-safety-fixed','07:00','08:00','safety'],['duty-lunch-fixed','12:00','13:00','lunch'],['duty-study-fixed','18:00','22:00','study']])s.data.events.push({id,title:kind?IeumDuties.types[kind].label:'이동 검증',date:dates[0],start,end,type:kind?'group':'personal',targets:kind?[teacher]:[],...(kind?{duty:{kind,assigned:[teacher],safety:[teacher],general:[]},readonly:true,canReschedule:true}:{}),note:'',place:''});localStorage.setItem('ieum-v1',JSON.stringify(s));},dates);
 await page.reload();await page.locator('[data-event="duty-lunch-fixed"]').waitFor();
 const read=id=>page.evaluate(id=>JSON.parse(localStorage.getItem('ieum-v1')).data.events.find(e=>e.id===id),id);

 async function drag(selector,minutes,column){const el=page.locator(selector);await el.scrollIntoViewIfNeeded();const box=await el.boundingBox(),bounds=await el.evaluate(e=>{const g=e.closest('[data-calendar-timeline]');return {height:g.getBoundingClientRect().height,start:+g.dataset.timelineStart,end:+g.dataset.timelineEnd};}),scale=bounds.height/(bounds.end-bounds.start);let x=box.x+box.width/2,y=box.y+box.height/2,dx=0;if(column!=null){const target=await page.locator('.hours[data-calendar-timeline]').nth(column).boundingBox();dx=target.x+target.width/2-x;}await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y+minutes*scale,{steps:8});await page.mouse.up();await page.waitForTimeout(500);}
 await drag('[data-event="user-drag-normal"]',60);assert.equal((await read('user-drag-normal')).start,'10:00');
 await drag('[data-event="user-drag-normal"] [data-resize=start]',-15);assert.equal((await read('user-drag-normal')).start,'09:45');
 await drag('[data-event="user-drag-normal"] [data-resize=end]',30);assert.equal((await read('user-drag-normal')).end,'11:30');
 await drag('[data-event="user-drag-normal"]',0,1);assert.equal((await read('user-drag-normal')).date,dates[1]);
 for(const kind of ['safety','lunch','study']){
   const id='duty-'+kind+'-fixed',selector=`[data-event="${id}"]`,before=await read(id);
   assert.equal(await page.locator(selector+' .event-resize').count(),0,'no duty resize handles, even with legacy canReschedule flag');
   for(const [delta,column] of [[60,null],[0,1]]){await drag(selector,delta,column);assert.deepEqual(await read(id),before);if(await page.locator('.modal').count())await page.locator('.modal-head [data-action=close-modal]').click();}
   for(const edge of ['top','bottom']){const el=page.locator(selector);await el.scrollIntoViewIfNeeded();const box=await el.boundingBox(),x=box.x+box.width/2,y=edge==='top'?box.y+2:box.y+box.height-2;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y+(edge==='top'?-30:30),{steps:8});await page.mouse.up();await page.waitForTimeout(200);assert.deepEqual(await read(id),before);if(await page.locator('.modal').count())await page.locator('.modal-head [data-action=close-modal]').click();}
   await page.locator(selector).click();await page.locator('.schedule-detail-modal').waitFor();assert.equal(await page.locator('[data-action=exchange-new]').count(),1,'click and exchange remain available');assert.ok(!(await page.locator('.modal-body').innerText()).includes('블록을 드래그'));await page.locator('.modal-head [data-action=close-modal]').click();
 }
 await page.reload();await page.locator('[data-event="duty-lunch-fixed"]').waitFor();assert.equal((await read('duty-lunch-fixed')).start,'12:00');assert.deepEqual(errors,[]);
 console.log('PASS: all three duty kinds reject move, cross-date and edge drags; no resize handles; details/exchange retained; personal move/resize remains available');
}finally{if(app)await app.close();fs.rmSync(data,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
