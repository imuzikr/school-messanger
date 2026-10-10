'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
test('send completion returns with server-extracted schedules already applied to the UI',async()=>{
 const context={window:{},setTimeout,clearTimeout};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/backend.js'),'utf8'),context);
 const empty={rooms:[],mails:[],events:[],notes:[],deadlines:[],tasks:[],shortcuts:[]},appointment={id:'server-event',title:'회의',date:'2026-10-12',start:'13:00',end:'15:00'};let shown=empty,requests=[];
 const native={subscribe(){},async request(route){requests.push(route);return route==='/sync'?{ok:true}:{user:{id:'me'},data:{...empty,events:[appointment]}};}};
 const backend=new context.window.IeumBackend(native,{data:r=>{shown=r.data;},status(){},error(message){throw Error(message);}});backend.activate({user:{id:'me'},data:empty});
 const sent=await backend.sync({...empty,mails:[{id:'out',from:'me',to:['recipient'],body:'내일 오후 1시~3시 회의'}]});assert.equal(sent,true);assert.equal(shown.events[0].id,appointment.id);assert.deepEqual(requests,['/sync','/bootstrap']);
});
test('calendar timing edits use authorized shared reschedule operations, including recipient copies',()=>{
 const context={window:{},setTimeout,clearTimeout};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/backend.js'),'utf8'),context);
 const backend=new context.window.IeumBackend({subscribe(){}},{}),before={rooms:[],mails:[],events:[{id:'shared',date:'2026-10-12',start:'13:00',end:'14:00',readonly:true,canReschedule:true,type:'group',targets:['me']}],deadlines:[{id:'due',date:'2026-10-12',dueTime:'12:05',rule:'lunch',source:{kind:'mail',id:'source'}}],notes:[],tasks:[],shortcuts:[]};
 const after=JSON.parse(JSON.stringify(before));Object.assign(after.events[0],{date:'2026-10-13',start:'14:00',end:'15:30'});Object.assign(after.deadlines[0],{dueTime:'16:15',rule:'explicit'});
 const operations=JSON.parse(JSON.stringify(backend.diff(before,after)));assert.deepEqual(operations,[{type:'event.reschedule',id:'shared',value:{date:'2026-10-13',start:'14:00',end:'15:30'}},{type:'deadline.reschedule',id:'due',value:{date:'2026-10-12',dueTime:'16:15'}}]);
 const untimed=JSON.parse(JSON.stringify(before));untimed.deadlines[0].dueTime='';assert.equal(backend.diff(before,untimed)[0].type,'item.upsert');
 const lessonBefore={...before,events:[{...before.events[0],readonly:false,type:'makeup',period:1,noticeMail:'lesson'}]},lessonAfter=JSON.parse(JSON.stringify(lessonBefore));lessonAfter.events[0].end='14:30';assert.equal(backend.diff(lessonBefore,lessonAfter)[0].type,'event.upsert');
});
