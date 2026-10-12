'use strict';
const assert=require('node:assert/strict'),https=require('node:https'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {_electron}=require('playwright'),{startServer}=require('../server/index.cjs');
(async()=>{const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'ieum-image-lan-')),clientDir=fs.mkdtempSync(path.join(os.tmpdir(),'ieum-image-client-')),password=crypto.randomBytes(20).toString('hex');let server,app;
 const request=(route,payload,token)=>new Promise((resolve,reject)=>{const body=payload===undefined?null:JSON.stringify(payload);const req=https.request(new URL(route,server.connection.url),{method:body?'POST':'GET',ca:server.connection.certificate,headers:{...(body?{'content-type':'application/json'}:{}),...(token?{authorization:'Bearer '+token}:{})}},res=>{let raw='';res.on('data',v=>raw+=v);res.on('end',()=>resolve({status:res.statusCode,...JSON.parse(raw)}));});req.on('error',reject);if(body)req.write(body);req.end();});
 try{
 server=await startServer({host:'127.0.0.1',port:0,address:'https://127.0.0.1:0',dataDir,admin:{username:'admin',password}});
 const admin=(await request('/login',{username:'admin',password})).token,u=await request('/admin/users',{username:'teacher',name:'교사',password,role:'교사',department:'교무부'},admin),token=(await request('/login',{username:'teacher',password})).token;await request('/password',{current:password,password:password+'x'},token);
 const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==';
 assert.equal((await request('/sync',{operations:[{type:'mail.send',id:'lan-image',value:{to:[u.id],cc:[],title:'캡처 이미지',body:'이미지 확인',html:'<p>이미지 확인</p><img src="'+png+'">',files:[]}}]},admin)).status,200);
 fs.writeFileSync(path.join(clientDir,'connection.json'),JSON.stringify(server.connection));
 app=await _electron.launch({executablePath:require('electron'),args:['--no-sandbox','--disable-gpu',path.resolve(__dirname,'..')],env:{...process.env,DISPLAY:process.env.DISPLAY||':99',IEUM_ROLE:'client',IEUM_TEST_DATA_DIR:clientDir},timeout:20000});const main=await app.firstWindow();await main.locator('#login-name').fill('teacher');await main.locator('#login-password').fill(password+'x');await main.locator('#login-form button[type=submit]').click();await main.locator('.person-line').first().waitFor();await require('./electron-helpers.cjs').dismissBriefing(main);
 const [inbox]=await Promise.all([app.waitForEvent('window'),main.locator('.rail [data-action=nav-inbox]').click()]);await inbox.locator('.mail-table-row[data-mail="lan-image"]').click();await inbox.waitForFunction(()=>document.querySelector('.mail-body img')?.naturalWidth===1);
 assert.equal(await inbox.locator('.mail-body img').count(),1);
 const [compose]=await Promise.all([app.waitForEvent('window'),inbox.locator('[data-action=forward-mail]').click()]);await compose.locator('#mail-editor img').waitFor();assert.equal(await compose.locator('#mail-editor img').getAttribute('src'),png);
 console.log('PASS: installed client login -> compact bootstrap -> authenticated lazy image retrieval -> rendered received image -> forwarding retains original image.');
 }finally{if(app)await app.close();if(server)await server.close();fs.rmSync(dataDir,{recursive:true,force:true});fs.rmSync(clientDir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
