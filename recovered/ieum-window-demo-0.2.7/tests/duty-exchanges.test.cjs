'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),x=require('../js/duty-exchanges.js'),d=require('../js/duties.js');
function fixture(kind='lunch'){
 const people=[{id:'a',name:'김교사',role:'교사',department:'교무부'},{id:'b',name:'이교사',role:'교사',department:'교무부'},{id:'s',name:'안전교사',role:'교사',department:'생활안전부'},{id:'m',name:'담당자',role:'교사',department:'생활안전부'}],config={safetyDepartment:'생활안전부',managers:{safety:['m'],lunch:['m'],study:['m']}};
 const events=d.plan(kind,kind==='safety'?[['2030-10-16','안전교사','김교사'],['2030-10-17','안전교사','이교사']]:[['2030-10-16','김교사'],['2030-10-17','이교사']],config,people).events;
 return {people,config,events,requests:[],today:'2030-10-15',now:1000};
}
const create=ctx=>x.create({id:'r1',fromEvent:ctx.events[0].id,toEvent:ctx.events[1].id,partner:'b',reason:'출장'}, {id:'a'},ctx);
test('exchange requires acceptance then manager approval; swaps only two teachers and preserves safety groups',()=>{
 for(const kind of ['safety','lunch','study']){const c=fixture(kind),original=structuredClone(c.events),r=create(c);c.requests=[r];assert.equal(r.status,'pending');assert.throws(()=>x.act(r,'approve','',{id:'m'},c),/수락/);assert.throws(()=>x.act(r,'accept','',{id:'a'},c),/받은 교사/);const accepted=x.act(r,'accept','가능합니다',{id:'b'},c);assert.equal(accepted.request.status,'approval');assert.deepEqual(c.events,original);assert.equal(accepted.events.length,0);assert.throws(()=>x.act(accepted.request,'approve','',{id:'a'},c),/담당자/);const result=x.act(accepted.request,'approve','승인',{id:'m'},c);assert.equal(result.request.status,'approved');assert.equal(result.request.history.length,3);assert.equal(result.events[0].duty.assigned.includes('b'),true);assert.equal(result.events[1].duty.assigned.includes('a'),true);assert.ok(result.events.every(e=>e.targets.includes('m')));if(kind==='safety')assert.ok(result.events.every(e=>e.duty.safety.includes('s')));assert.throws(()=>x.act(result.request,'approve','',{id:'m'},c),/종료/);}
});
test('cancel, decline and reject preserve assignments; authorities and duplicate requests are enforced',()=>{
 const c=fixture(),r=create(c);c.requests=[r];assert.throws(()=>create(c),/이미 등록/);assert.throws(()=>x.create({...r,id:'r2',fromEvent:c.events[0].id,toEvent:c.events[1].id,partner:'b',reason:''},{id:'a'},c),/진행 중/);
 assert.throws(()=>x.act(r,'cancel','',{id:'b'},c),/요청한/);assert.equal(x.act(r,'cancel','',{id:'a'},c).request.status,'cancelled');assert.equal(x.act(r,'decline','',{id:'b'},c).request.status,'declined');const accepted=x.act(r,'accept','',{id:'b'},c).request;assert.equal(x.act(accepted,'reject','출장 확인 불가',{id:'m'},c).request.status,'rejected');assert.equal(x.act(accepted,'cancel','',{id:'a'},c).request.status,'cancelled');assert.throws(()=>x.act(accepted,'decline','',{id:'b'},c),/이미 응답/);
});
test('approval blocks time conflicts, stale assignments, past dates and cross-group safety exchanges',()=>{
 const c=fixture(),r=x.act(create(c),'accept','',{id:'b'},c).request;c.events.push({id:'busy',date:c.events[1].date,start:'12:30',end:'13:30',owner:'a',targets:[]});assert.throws(()=>x.act(r,'approve','',{id:'m'},c),/겹칩니다/);c.events.pop();c.events[0].start='11:45';assert.throws(()=>x.act(r,'approve','',{id:'m'},c),/변경/);assert.equal(x.reconcile([r],c)[0].status,'invalidated');c.today='2030-10-18';assert.equal(x.reconcile([r],c)[0].status,'expired');
 const safety=fixture('safety');safety.people.push({id:'s2',name:'안전교사2',role:'교사',department:'생활안전부'});safety.events[1]=d.reassign(safety.events[1],['s2','b'],safety.config,safety.people);assert.throws(()=>x.create({id:'r3',fromEvent:safety.events[0].id,toEvent:safety.events[1].id,partner:'s2',reason:''},{id:'a'},safety),/담당 구분/);
});
test('visibility and roster safeguards reject spoofing, no manager, duplicate assignments and changed people',()=>{
 const c=fixture(),r=create(c);assert.equal(x.visible(r,{id:'s'},c),false);assert.equal(x.visible(r,{id:'m'},c),true);assert.equal(x.visible(r,{id:'admin',admin:true},c),true);assert.throws(()=>x.create({id:'r2',fromEvent:r.from.id,toEvent:r.to.id,partner:'b',reason:''},{id:'s'},c),/본인/);c.people.find(p=>p.id==='b').disabled=true;assert.equal(x.reconcile([r],c)[0].status,'invalidated');
});

test('calendar origin observer is preserved and notification names both teachers and dates',()=>{
 const c=fixture();c.events.forEach(e=>e.owner='origin');const r=create(c);assert.equal(x.visible(r,{id:'origin'},c),true);assert.equal(x.manager({id:'origin'},r.kind,c),false,'origin viewing does not grant approval authority');const accepted=x.act(r,'accept','',{id:'b'},c).request,result=x.act(accepted,'approve','',{id:'m'},c);assert.ok(result.events.every(e=>e.targets.includes('origin')));const n=x.notification(result.request);assert.match(n.title,/교환 완료/);assert.match(n.body,/김교사 ↔ 이교사/);assert.match(n.body,/2030-10-16 ↔ 2030-10-17/);assert.equal(x.version(result.request),'approved:3');
});

test('remaining-month candidates exclude past days and next month including year and leap boundaries',()=>{
 for(const [today,accepted,rejected] of [['2030-10-15',['2030-10-15','2030-10-31'],['2030-10-14','2030-11-01','2031-10-16']],['2029-12-31',['2029-12-31'],['2029-12-30','2030-01-01']],['2028-02-28',['2028-02-28','2028-02-29'],['2028-02-27','2028-03-01']]]){for(const day of accepted)assert.equal(x.remainingMonth(day,today),true);for(const day of rejected)assert.equal(x.remainingMonth(day,today),false);}
 const c=fixture();c.events[1].date='2030-11-01';assert.throws(()=>create(c),/이번 달 말일/);
});
