'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {_electron}=require('playwright');
(async()=>{
 const data=fs.mkdtempSync(path.join(os.tmpdir(),'ieum-electron-demo-'));
 let app;
 try{
  app=await _electron.launch({executablePath:require('electron'),args:['--no-sandbox','--disable-gpu',path.resolve(__dirname,'..')],env:{...process.env,DISPLAY:process.env.DISPLAY||':99',IEUM_ROLE:'demo',IEUM_TEST_DATA_DIR:data},timeout:20000});
  const page=await app.firstWindow();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.waitForLoadState();
  await page.getByText('v0.2.13',{exact:false}).first().waitFor();
  assert.equal(await page.evaluate(()=>window.ieumDesktop.mode),'demo');
  assert.equal(await page.locator('.school-tools [data-action="class-teachers"]').count(),0);
  await page.locator('[data-action="settings"]').first().click();
  await page.locator('.modal [data-action="class-teachers"]').click();
  await page.locator('.modal-head [data-action="close-modal"] svg').click();
  await page.waitForFunction(()=>!document.querySelector('#modal-root').firstChild);
  const [calendar]=await Promise.all([app.waitForEvent('window'),page.locator('[data-action="nav-calendar"]').first().click()]);
  await calendar.locator('[data-calendar-timeline]').first().waitFor();
  assert.ok(await calendar.locator('[data-calendar-timeline]').count()>=5);
  await calendar.locator('[data-action="demo-deadline"]').click();
  await calendar.locator('[form="demo-deadline-form"]').click();
  await calendar.waitForFunction(()=>document.querySelector('#demo-deadline-result').textContent.includes('12:05'));
  await calendar.locator('.modal-head [data-action="close-modal"] svg').click();
  await calendar.waitForFunction(()=>!document.querySelector('#modal-root').firstChild);
  assert.ok(!page.isClosed());
  assert.deepEqual(errors,[]);
  console.log('PASS: Electron 44.7.0 automatic demo entry, preload bridge, v0.2.13, IPC-created independent calendar window, main window retained (OS sandbox disabled for cloud container)');
 }finally{if(app)await app.close();fs.rmSync(data,{recursive:true,force:true})}
})().catch(error=>{console.error(error);process.exitCode=1});
