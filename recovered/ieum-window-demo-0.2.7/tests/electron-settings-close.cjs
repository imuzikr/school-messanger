'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{_electron}=require('playwright');
(async()=>{const data=fs.mkdtempSync(path.join(os.tmpdir(),'ieum-settings-close-'));let app;
try{
 app=await _electron.launch({executablePath:process.env.IEUM_TEST_EXECUTABLE||require('electron'),args:['--no-sandbox','--disable-gpu','--force-device-scale-factor=1.25','--user-data-dir='+data,...(process.env.IEUM_TEST_EXECUTABLE?[]:[path.resolve(__dirname,'..')])],env:{...process.env,DISPLAY:process.env.DISPLAY||':99',IEUM_ROLE:'demo'},timeout:30000});const p=await app.firstWindow();await require('./electron-helpers.cjs').dismissBriefing(p);const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const open=async()=>{await p.locator('.rail [data-action=settings]').click();await p.locator('.settings-modal').waitFor();};
 const dismissed=()=>p.locator('.settings-modal').waitFor({state:'detached'});
 for(const mode of ['closed','calendar','both','memo']){
  if(mode==='calendar')await p.locator('.rail [data-action=toggle-today]').click();if(mode==='both')await p.locator('.memo-tab').click();if(mode==='memo')await p.locator('.rail [data-action=toggle-today]').click();
  await open();await p.locator('[data-action=font-plus][data-setting=orgFont]').click();await p.locator('#dark-mode').check();await p.locator('#calendar-position').selectOption('right');await p.locator('.settings-modal .modal-body').evaluate(el=>el.scrollTop=el.scrollHeight);
  const close=p.locator('.settings-modal .modal-head [data-action=close-modal]');assert.equal(await close.evaluate(el=>getComputedStyle(el).webkitAppRegion),'no-drag');await close.click({trial:true});assert.ok((await close.boundingBox()).width>=39.5);await close.click();await dismissed();
  await open();assert.equal(await p.locator('#calendar-position').inputValue(),'right');assert.equal(await p.locator('#dark-mode').isChecked(),true);await p.locator('.settings-modal .modal-foot [data-action=close-modal]').click();await dismissed();
  await open();await p.locator('.settings-modal .modal-head [data-action=close-modal]').focus();await p.keyboard.press('Enter');await dismissed();
 }
 await open();await p.keyboard.press('Escape');await dismissed();await p.reload();await p.locator('.person-line').first().waitFor();await open();assert.equal(await p.locator('#calendar-position').inputValue(),'right');await p.locator('.settings-modal .modal-head [data-action=close-modal]').click();await dismissed();assert.deepEqual(errors,[]);
 console.log('PASS: settings X after font/theme/calendar changes and scrolling, both wing states, footer completion, keyboard dismissal, repeated reopening and saved preferences after reload');
}finally{if(app)await app.close();fs.rmSync(data,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
