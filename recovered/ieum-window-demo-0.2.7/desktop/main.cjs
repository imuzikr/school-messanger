'use strict';
const {app,screen,BrowserWindow,ipcMain,protocol,net:electronNet,dialog,Menu,Tray,Notification,shell,safeStorage}=require('electron');
const path=require('node:path');const fs=require('node:fs');const https=require('node:https');const crypto=require('node:crypto');const os=require('node:os');const {pathToFileURL}=require('node:url');
const ROOT=path.resolve(__dirname,'..');
protocol.registerSchemesAsPrivileged([{scheme:'ieum',privileges:{standard:true,secure:true,supportFetchAPI:true}}]);
let mainWindow,tray,connection,token=null,stream=null,reconnect=null,localServer=null,quitting=false,liveUsername=null;
const role=app.isPackaged?require('../package.json').ieumRole||'client':process.env.IEUM_ROLE||'client';
app.setName(role==='demo'?'IeumDemo':role==='server'?'IeumServer':'IeumClient');
if(!app.isPackaged&&process.env.IEUM_TEST_DATA_DIR)app.setPath('userData',process.env.IEUM_TEST_DATA_DIR);
const windows=new Set();
let todaySide='left',todayAnimation=null,todayOpen=false;
const TODAY_WIDTH=330;
const connectionPath=()=>path.join(app.getPath('userData'),'connection.json');
const configPath=()=>path.join(app.getPath('userData'),'server-config.json');
function readJSON(file){try{return JSON.parse(fs.readFileSync(file,'utf8'));}catch{return null;}}
function validateConnection(value){
 if(!value||value.version!==1||typeof value.certificate!=='string'||value.certificate.length>20000)throw new Error('이음 서버 연결 파일이 올바르지 않습니다.');
 const u=new URL(value.url);if(u.protocol!=='https:'||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw new Error('HTTPS 서버 주소만 사용할 수 있습니다.');
 const cert=new crypto.X509Certificate(value.certificate);if(value.fingerprint&&cert.fingerprint256!==value.fingerprint)throw new Error('인증서 지문이 일치하지 않습니다.');
 return {version:1,url:u.origin,certificate:value.certificate,fingerprint:cert.fingerprint256,schoolName:String(value.schoolName||'우리 학교').slice(0,60)};
}
function trustedSender(event){if(!event.senderFrame?.url?.startsWith('ieum://app/'))throw new Error('허용되지 않은 화면 요청입니다.');}
const expose=(name,handler)=>ipcMain.handle(name,async(event,...args)=>{trustedSender(event);try{return await handler(event,...args);}catch(error){return {error:error.message||'요청을 처리하지 못했습니다.'};}});
const emit=data=>{for(const w of windows)if(!w.isDestroyed())w.webContents.send('ieum:update',data);};
function request(route,payload){return new Promise((resolve,reject)=>{
 if(role==='demo')return reject(new Error('창 체험 데모는 실제 서버에 연결하지 않습니다.'));
 if(!connection)return reject(new Error('관리자에게 받은 서버 연결 파일을 먼저 가져오세요.'));
 if(!/^\/(health|login|logout|password|bootstrap|sync|attachment|message-source|admin\/users|admin\/user)$/.test(route))return reject(new Error('지원하지 않는 요청입니다.'));
 const body=payload===undefined?null:JSON.stringify(payload);const url=new URL(route,connection.url);
 const req=https.request(url,{method:body?'POST':'GET',ca:connection.certificate,minVersion:'TLSv1.2',headers:{...(body?{'content-type':'application/json','content-length':Buffer.byteLength(body)}:{}),...(token?{authorization:'Bearer '+token}:{})},timeout:20000},res=>{let bytes=0,raw='';res.on('data',chunk=>{bytes+=chunk.length;if(bytes>16*1024*1024){res.destroy(new Error('서버 응답이 너무 큽니다.'));return}raw+=chunk});res.on('error',reject);res.on('end',()=>{let result;try{result=JSON.parse(raw);}catch{return reject(new Error('서버 응답을 읽을 수 없습니다.'));}if(res.statusCode>=400){if(res.statusCode===401&&route!=='/login'){token=null;stopStream();emit({kind:'expired'});}resolve({...result,status:res.statusCode});}else resolve(result);});});
 req.on('timeout',()=>req.destroy(new Error('서버 연결 시간이 초과되었습니다.')));req.on('error',error=>reject(new Error(error.code?.startsWith('CERT')||['DEPTH_ZERO_SELF_SIGNED_CERT','UNABLE_TO_VERIFY_LEAF_SIGNATURE','ERR_TLS_CERT_ALTNAME_INVALID'].includes(error.code)?'서버 인증서를 확인할 수 없습니다. 올바른 연결 파일과 서버 주소를 확인하세요.':'교내 서버에 연결할 수 없습니다. 서버 PC와 네트워크를 확인하세요.')));if(body)req.write(body);req.end();
 });}
function stopStream(){clearTimeout(reconnect);reconnect=null;if(stream){stream.destroy();stream=null;}}
function connectStream(){
 stopStream();if(!token||!connection)return;let activeToken=token;
 const req=https.get(new URL('/events',connection.url),{ca:connection.certificate,headers:{authorization:'Bearer '+token},minVersion:'TLSv1.2'},res=>{
  if(res.statusCode!==200){if(res.statusCode===401){token=null;emit({kind:'expired'});}res.resume();return;}
  emit({kind:'connected'});let raw='';res.setEncoding('utf8');res.on('data',chunk=>{raw+=chunk;let at;while((at=raw.indexOf('\n\n'))>=0){const frame=raw.slice(0,at);raw=raw.slice(at+2);const data=frame.split('\n').find(line=>line.startsWith('data: '));if(data){try{emit(JSON.parse(data.slice(6)));}catch{}}}if(raw.length>100000)raw='';});res.on('error',()=>{});res.on('end',retry);
 });stream=req;req.on('error',retry);
 function retry(){if(activeToken!==token||!token)return;emit({kind:'disconnected'});if(!reconnect)reconnect=setTimeout(()=>{reconnect=null;connectStream()},3000);}
}
function createWindow(url,options={}){
 const window=new BrowserWindow({width:options.width||430,height:options.height||830,minWidth:options.minWidth||390,minHeight:600,show:false,frame:false,backgroundColor:'#f6f8f4',title:'이음',...options,webPreferences:{preload:path.join(__dirname,'preload.cjs'),additionalArguments:[...(role==='demo'?['--ieum-demo']:[]),...(options.mainHost?['--ieum-main-host']:[])],contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}});
 windows.add(window);window.once('ready-to-show',()=>{window.show();});window.on('closed',()=>windows.delete(window));
 window.webContents.setWindowOpenHandler(({url})=>{try{if(['https:','http:'].includes(new URL(url).protocol))shell.openExternal(url);}catch{}return {action:'deny'};});
 window.webContents.on('will-navigate',(e,target)=>{if(!target.startsWith('ieum://app/'))e.preventDefault();});
 window.loadURL(url);return window;
}
function bringMain(){if(mainWindow&&!mainWindow.isDestroyed()){mainWindow.show();mainWindow.focus();}}
function serverDataDir(){return path.join(app.getPath('userData'),'server-data');}
async function startLocal(config,admin){
 if(localServer)return {ok:true};
 if(role==='demo')throw new Error('화면 체험 앱은 서버를 실행하지 않습니다.');
 const {startServer}=require('../server/index.cjs');
 const parsed={port:Number(config.port)||8443,address:config.url,schoolName:config.schoolName,dataDir:serverDataDir(),admin,onChange:()=>emit({kind:'server-stats'}),onError:error=>console.error('Server operation failed:',error.name)};
 localServer=await startServer(parsed);fs.writeFileSync(configPath(),JSON.stringify({url:config.url,port:parsed.port,schoolName:config.schoolName}),{mode:0o600});
 connection=validateConnection({...localServer.connection,url:`https://localhost:${localServer.port}`});
 emit({kind:'server-started'});return {ok:true};
}
app.on('second-instance',bringMain);
if(!app.requestSingleInstanceLock())app.quit();
else app.whenReady().then(async()=>{
 app.setAppUserModelId(role==='server'?'kr.ieum.server':'kr.ieum.client');
 protocol.handle('ieum',request=>{const url=new URL(request.url);let decoded;try{decoded=decodeURIComponent(url.pathname);}catch{return new Response('Bad path',{status:400})}const file=path.resolve(ROOT,'.'+decoded);if(!file.startsWith(ROOT+path.sep)||decoded.includes('\0'))return new Response('Forbidden',{status:403});const rel=path.relative(ROOT,file).split(path.sep);if(!['index.html','css','js','assets','data','desktop'].includes(rel[0])||rel.some(v=>v.endsWith('.cjs'))||!fs.existsSync(file)||!fs.statSync(file).isFile())return new Response('Not found',{status:404});return electronNet.fetch(pathToFileURL(file).href);});
 connection=role==='demo'?null:readJSON(connectionPath());if(connection){try{connection=validateConnection(connection)}catch{connection=null}}
 Menu.setApplicationMenu(null);
 const area=screen.getPrimaryDisplay().workArea,host=role!=='server';
 mainWindow=createWindow(role==='server'?'ieum://app/desktop/server.html':'ieum://app/index.html',host?{mainHost:true,transparent:true,backgroundColor:'#00000000',hasShadow:false,width:430+TODAY_WIDTH,height:Math.min(830,area.height),minWidth:390+TODAY_WIDTH,x:area.x+Math.round((area.width-430)/2)-TODAY_WIDTH,y:area.y+Math.max(0,Math.round((area.height-830)/2))}:{width:760,height:760,minWidth:650});
 if(host){mainWindow.on('resize',()=>applyMainShape(todayOpen));applyMainShape(false);}
 // One native window owns both views: focus, move, minimize and restore are atomic.
 mainWindow.on('close',e=>{if(!quitting){e.preventDefault();mainWindow.hide();}});
 const {nativeImage}=require('electron');const trayImage=nativeImage.createFromPath(path.join(ROOT,'assets','ieum-icon.png'));tray=new Tray(trayImage.resize({width:20,height:20}));tray.setToolTip(role==='server'?'이음 교내 서버':'이음 학교 메신저');tray.on('double-click',bringMain);tray.setContextMenu(Menu.buildFromTemplate([{label:role==='server'?'서버 관리 열기':'메신저 열기',click:bringMain},{type:'separator'},{label:'이음 종료',click:()=>{quitting=true;app.quit()}}]));
 if(role==='server'){const cfg=readJSON(configPath());if(cfg){try{await startLocal(cfg);}catch{emit({kind:'server-start-error'});}}}
});
expose('ieum:connection',()=>connection?{url:connection.url,schoolName:connection.schoolName,fingerprint:connection.fingerprint}:null);
expose('ieum:import',async()=>{if(role==='server')throw new Error('서버 관리 앱에서는 연결 파일을 가져오지 않습니다.');const result=await dialog.showOpenDialog(mainWindow,{title:'관리자에게 받은 이음 서버 연결 파일 선택',filters:[{name:'이음 연결 파일',extensions:['json']}],properties:['openFile']});if(result.canceled)return null;const file=result.filePaths[0];if(fs.statSync(file).size>50000)throw new Error('연결 파일 크기가 올바르지 않습니다.');const value=validateConnection(readJSON(file));const choice=await dialog.showMessageBox(mainWindow,{type:'question',title:'교내 서버 연결 확인',message:value.schoolName+' 서버에 연결할까요?',detail:value.url+'\n\n인증서 지문:\n'+value.fingerprint+'\n\n관리자가 안내한 주소와 지문이 일치하는지 확인하세요. 이 파일에는 비밀번호가 없습니다.',buttons:['취소','확인 후 연결'],defaultId:0,cancelId:0});if(choice.response!==1)return null;token=null;stopStream();connection=value;fs.writeFileSync(connectionPath(),JSON.stringify(value),{mode:0o600});return {url:value.url,schoolName:value.schoolName,fingerprint:value.fingerprint};});
expose('ieum:request',async(event,route,payload)=>{
 const result=await request(route,payload);if(route==='/login'&&result.token){token=result.token;liveUsername=payload.username;const clean={...result};delete clean.token;if(!result.user.mustChange)connectStream();return clean;}
 if(route==='/password'&&!result.error)connectStream();
 if(route==='/logout'){token=null;liveUsername=null;stopStream();emit({kind:'logout'});}return result;
});
expose('ieum:window',(event,action)=>{const w=BrowserWindow.fromWebContents(event.sender);if(action==='minimize')w.minimize();else if(action==='close')w.close();else if(action==='maximize')w.isMaximized()?w.unmaximize():w.maximize();else if(action==='show')w.show();});
function applyMainShape(open){
 if(!mainWindow||mainWindow.isDestroyed()||role==='server')return;
 const b=mainWindow.getContentBounds();
 // Closed reserve is absent from the native hit/paint region, so it cannot block another app.
 const region=open?[{x:0,y:0,width:b.width,height:b.height}]:[{x:todaySide==='left'?TODAY_WIDTH:0,y:0,width:b.width-TODAY_WIDTH,height:b.height}];
 mainWindow.setShape(region);
}
expose('ieum:resize',()=>({ok:true}));
expose('ieum:today',(event,open,position)=>{
 if(BrowserWindow.fromWebContents(event.sender)!==mainWindow||role==='server')throw new Error('본창에서만 오늘 일정을 열 수 있습니다.');
 const side=position==='right'?'right':position==='left'?'left':todaySide;
 const wasOpen=todayOpen;
 clearTimeout(todayAnimation);
 if(side!==todaySide){
  const b=mainWindow.getBounds();
  // Shift the transparent host, keeping the organization rectangle at exactly the same screen coordinates.
  mainWindow.setBounds({...b,x:b.x+(todaySide==='left'?TODAY_WIDTH:-TODAY_WIDTH)},false);
  todaySide=side;
 }
 todayOpen=!!open;
 if(todayOpen)applyMainShape(true);
 else if(!wasOpen)applyMainShape(false);
 else todayAnimation=setTimeout(()=>applyMainShape(false),480);
 emit({kind:'today-panel',open:todayOpen,side:todaySide});
 return {ok:true};
});
expose('ieum:workspace',(event,page)=>{if(!['inbox','calendar','announcements','links'].includes(page))throw new Error('지원하지 않는 작업 창입니다.');const previous=[...windows].find(w=>!w.isDestroyed()&&w.ieumPage===page);if(previous){previous.show();previous.focus();return {ok:true};}const w=createWindow('ieum://app/index.html?workspace='+page,{width:page==='calendar'?1180:1080,height:800,minWidth:page==='inbox'?1000:700});w.ieumPage=page;return {ok:true};});
expose('ieum:compose',(event,draft={})=>{if(!draft||typeof draft!=='object'||JSON.stringify(draft).length>4*1024*1024)throw new Error('작성 내용이 너무 큽니다.');const w=createWindow('ieum://app/index.html?compose=1',{width:720,height:820,minWidth:620});w.ieumComposeDraft=draft;return {ok:true};});
expose('ieum:compose-draft',event=>BrowserWindow.fromWebContents(event.sender).ieumComposeDraft||BrowserWindow.fromWebContents(event.sender).ieumEventDraft||{});
expose('ieum:compose-sent',(event,linked)=>{const w=BrowserWindow.fromWebContents(event.sender);if(!w.ieumComposeDraft)throw new Error('작성 창에서만 완료할 수 있습니다.');emit({kind:'changed'});w.close();bringMain();if(linked&&typeof linked.title==='string'&&typeof linked.mail==='string'){const calendar=createWindow('ieum://app/index.html?workspace=calendar&eventDraft=1',{width:1180,height:800,minWidth:700});calendar.ieumEventDraft={title:linked.title.slice(0,150),mail:linked.mail,date:linked.date};}return {ok:true};});
expose('ieum:chat',(event,room)=>{if(typeof room!=='string'||!/^[-A-Za-z0-9]{1,100}$/.test(room))throw new Error('대화방 식별자가 올바르지 않습니다.');const old=[...windows].find(w=>!w.isDestroyed()&&w.ieumRoom===room);if(old){old.show();old.focus();return {ok:true};}const w=createWindow('ieum://app/index.html?chat='+encodeURIComponent(room),{width:420,height:680,minWidth:350});w.ieumRoom=room;return {ok:true};});
expose('ieum:admin',()=>{if(role!=='server')throw new Error('서버 관리 앱에서 사용할 수 있습니다.');const w=createWindow('ieum://app/desktop/admin.html',{width:1000,height:780,minWidth:750});return {ok:true};});
expose('ieum:server-status',()=>{if(role!=='server')throw new Error('서버 관리 앱에서 사용할 수 있습니다.');const cfg=readJSON(configPath());return {running:!!localServer,configured:!!cfg,url:cfg?.url||'',schoolName:cfg?.schoolName||'',dataDir:serverDataDir(),fingerprint:localServer?.connection.fingerprint||'',stats:localServer?.stats()||null,addresses:Object.values(os.networkInterfaces()).flat().filter(i=>i&&i.family==='IPv4'&&!i.internal).map(i=>i.address),autoStart:app.getLoginItemSettings().openAtLogin};});
expose('ieum:start-server',async(event,config)=>{if(role!=='server')throw new Error('서버 관리 앱에서 사용할 수 있습니다.');const admin=readJSON(configPath())?undefined:{username:config.username,password:config.password,name:config.name};return startLocal(config,admin);});
expose('ieum:export',async()=>{if(role!=='server'||!localServer)throw new Error('서버를 먼저 실행해 주세요.');const result=await dialog.showSaveDialog(mainWindow,{title:'교직원에게 전달할 서버 연결 파일',defaultPath:'ieum-server.json',filters:[{name:'이음 연결 파일',extensions:['json']}]});if(result.canceled)return null;fs.writeFileSync(result.filePath,JSON.stringify(localServer.connection,null,2));return {ok:true};});
expose('ieum:backup',async()=>{if(role!=='server'||!localServer)throw new Error('서버를 먼저 실행해 주세요.');const result=await dialog.showSaveDialog(mainWindow,{title:'교내 메신저 데이터 백업',defaultPath:'ieum-backup-'+new Date().toISOString().slice(0,10)+'.sqlite',filters:[{name:'이음 데이터베이스',extensions:['sqlite']}]});if(result.canceled)return null;localServer.backup(result.filePath);return {ok:true};});
expose('ieum:auto-start',(event,enabled)=>{app.setLoginItemSettings({openAtLogin:enabled});return {ok:true};});
expose('ieum:notify',(event,value)=>{const title=String(value?.title||'이음').slice(0,100),body=String(value?.body||'새 소식이 도착했습니다.').slice(0,250);if(Notification.isSupported())new Notification({title,body,silent:false}).show();});
app.on('before-quit',e=>{if(localServer){e.preventDefault();const running=localServer;localServer=null;quitting=true;stopStream();running.close().finally(()=>app.quit());}else{quitting=true;stopStream();}});
app.on('window-all-closed',()=>{});
