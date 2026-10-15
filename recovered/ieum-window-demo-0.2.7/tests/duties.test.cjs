'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const duties=require('../js/duties.js');
const people=[{id:'m',name:'담당',department:'교무부',role:'교사'},{id:'s',name:'안전',department:'생활안전부',role:'교사'},{id:'a',name:'가교사',department:'교무부',role:'교사'},{id:'b',name:'나교사',department:'교무부',role:'교사'},{id:'x',name:'직원',department:'행정실',role:'행정직원'}];
const config={safetyDepartment:'생활안전부',managers:{safety:['m'],lunch:['m'],study:['m']}};
test('duty date parsing supports Excel serials, formatted dates and real calendar dates',()=>{
 assert.equal(duties.date(1),'1900-01-01');assert.equal(duties.date(61),'1900-03-01');assert.throws(()=>duties.date(60));assert.equal(duties.date('2026년 10월 15일'),'2026-10-15');assert.equal(duties.date('2026.10.15 (목)'),'2026-10-15');assert.throws(()=>duties.date('2026-02-29'));assert.equal(duties.date(new Date('2028-02-29Z')),'2028-02-29');
});
test('managers receive every date while assigned teachers receive only their dates, and repeated dates merge',()=>{
 const p=duties.plan('study',[['날짜','이름'],['2026-10-15','가교사'],['2026-10-16','나교사'],['2026-10-15','나교사']],config,people);assert.deepEqual(p.errors,[]);assert.equal(p.events.length,2);assert.deepEqual(p.events[0].targets,['m','a','b']);assert.deepEqual(p.events[1].targets,['m','b']);assert.equal(p.events[0].start,'18:00');assert.equal(p.events[0].end,'22:00');assert.equal(p.events[0].id,'duty-study-2026-10-15');
});
test('safety rosters enforce the selected department and reject unknown, nonteacher and ambiguous names',()=>{
 assert.deepEqual(duties.plan('safety',[['2026-10-15','안전','가교사']],config,people).errors,[]);
 for(const row of [['2026-10-15','가교사','안전'],['2026-10-15','안전','직원'],['2026-10-15','안전','없음'],['2026-10-15','안전','가교사','추가']])assert.equal(duties.plan('safety',[row],config,people).errors.length,1);
 assert.equal(duties.plan('lunch',[['2026-10-15','가교사']],config,[...people,{...people[2],id:'duplicate'}]).errors.length,1);
 assert.throws(()=>duties.plan('lunch',[['2026-10-15','가교사']],{...config,managers:{...config.managers,lunch:[]}},people));
});

test('duty reassignment replaces calendar targets, preserves duty times and validates active teachers',()=>{
 for(const [kind,tag] of [['safety','안전 지도'],['lunch','중식 지도'],['study','자율학습']]){
  const event=duties.plan(kind,kind==='safety'?[['2026-10-16','안전','가교사']]:[['2026-10-16','가교사']],config,people).events[0];
  const next=duties.reassign(event,kind==='safety'?['s','b']:['b'],config,people);
  assert.deepEqual(next.targets,kind==='safety'?['m','s','b']:['m','b']);assert.ok(!next.targets.includes('a'));assert.equal(next.date,event.date);assert.equal(next.start,event.start);assert.equal(next.end,event.end);assert.equal(duties.types[kind].tag,tag);
  assert.throws(()=>duties.reassign(event,[],config,people));assert.throws(()=>duties.reassign(event,['x'],config,people));assert.throws(()=>duties.reassign(event,['b'],config,people.map(p=>p.id==='b'?{...p,disabled:true}:p)));
 }
});
