'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{_electron}=require('playwright');
(async()=>{const data=fs.mkdtempSync(path.join(os.tmpdir(),'ieum-titles-'));let app;
try{
 app=await _electron.launch({executablePath:process.env.IEUM_TEST_EXECUTABLE||require('electron'),args:['--no-sandbox','--disable-gpu',...(process.env.IEUM_TEST_EXECUTABLE?[]:[path.resolve(__dirname,'..')])],env:{...process.env,DISPLAY:process.env.DISPLAY||':99',IEUM_ROLE:'demo',IEUM_TEST_DATA_DIR:data},timeout:30000});
 const main=await app.firstWindow();await require('./electron-helpers.cjs').dismissBriefing(main);const errors=[];main.on('pageerror',e=>errors.push(e.message));
 const cases=[{choice:null,input:'',expected:'기타'},{choice:'회의',input:'',expected:'회의'},{choice:'행사',input:'  직접 입력한 제목  ',expected:'직접 입력한 제목'},{choice:'제출',input:'   ',expected:'제출'}];
 for(const [i,test] of cases.entries()){
  const opened=app.waitForEvent('window');await main.locator('.person-line').first().dblclick();const compose=await opened;compose.on('pageerror',e=>errors.push(e.message));
  await compose.locator('#mail-editor').waitFor();const options=compose.locator('[data-title-choice]');assert.deepEqual(await options.allTextContents(),['공지','마감','연수','제출','행사','회의','행정실','기타']);assert.equal(await compose.locator('[data-title-choice][aria-pressed=true]').getAttribute('data-title-choice'),'기타');
  if(test.choice){await compose.locator(`[data-title-choice="${test.choice}"]`).click();assert.equal(await compose.locator('[data-title-choice][aria-pressed=true]').count(),1);}
  await compose.locator('#mail-title').fill(test.input);
  // Changing composer modes must preserve both the custom title and its fallback choice.
  await compose.locator('[data-action=compose-mode][data-mode=scheduled]').click();await compose.locator('[data-action=compose-mode][data-mode=general]').click();assert.equal(await compose.locator('#mail-title').inputValue(),test.input);
  if(test.choice)assert.equal(await compose.locator('[data-title-choice][aria-pressed=true]').getAttribute('data-title-choice'),test.choice);
  if(i===0){fs.mkdirSync(path.resolve(__dirname,'../release'),{recursive:true});await compose.screenshot({path:path.resolve(__dirname,'../release/title-options.png')});}
  const body=`제목 선택 검증 본문 ${i}`;await compose.locator('#mail-editor').fill(body);await compose.locator('[form=compose-form]').click().catch(e=>{if(!compose.isClosed())throw e;});
  await main.waitForFunction(body=>JSON.parse(localStorage.getItem('ieum-v1')).data.mails.some(m=>m.body===body),body);
  const saved=await main.evaluate(body=>JSON.parse(localStorage.getItem('ieum-v1')).data.mails.find(m=>m.body===body),body);assert.equal(saved.title,test.expected);assert.equal(saved.body,body);
 }
 await main.reload();await main.locator('.person-line').first().waitFor();
 const titles=await main.evaluate(()=>JSON.parse(localStorage.getItem('ieum-v1')).data.mails.filter(m=>m.body.startsWith('제목 선택 검증 본문 ')).map(m=>m.title));assert.deepEqual(titles.sort(),cases.map(c=>c.expected).sort());assert.deepEqual(errors,[]);
 console.log('PASS: eight single-select title buttons; default 기타; selected label fallback; typed title priority; mode preservation and persisted titles');
}finally{if(app)await app.close();fs.rmSync(data,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
