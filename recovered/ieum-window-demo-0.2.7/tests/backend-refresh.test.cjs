'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
test('send completion returns with server-extracted schedules already applied to the UI',async()=>{
 const context={window:{},setTimeout,clearTimeout};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/backend.js'),'utf8'),context);
 const empty={rooms:[],mails:[],events:[],notes:[],deadlines:[],tasks:[],shortcuts:[]},appointment={id:'server-event',title:'회의',date:'2026-10-12',start:'13:00',end:'15:00'};let shown=empty,requests=[];
 const native={subscribe(){},async request(route){requests.push(route);return route==='/sync'?{ok:true}:{user:{id:'me'},data:{...empty,events:[appointment]}};}};
 const backend=new context.window.IeumBackend(native,{data:r=>{shown=r.data;},status(){},error(message){throw Error(message);}});backend.activate({user:{id:'me'},data:empty});
 const sent=await backend.sync({...empty,mails:[{id:'out',from:'me',to:['recipient'],body:'내일 오후 1시~3시 회의'}]});assert.equal(sent,true);assert.equal(shown.events[0].id,appointment.id);assert.deepEqual(requests,['/sync','/bootstrap']);
});
