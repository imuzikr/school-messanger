'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const rules=require('../js/message-deadlines.js');
const sent='2026-10-10T15:30:00Z'; // Sunday, October 11 in Korea
const cases=[
 ['내일까지 제출','2026-10-12','16:00'],['16일까지 회신','2026-10-16','16:00'],
 ['다음 주 수요일까지 제출','2026-10-14','16:00'],['이번 주 수요일까지 제출','2026-10-07','16:00'],
 ['오전 중 자료 제출','2026-10-11','12:05'],['점심시간 전까지 회신','2026-10-11','12:05'],
 ['내일 오전 중 제출','2026-10-12','12:05'],['내일 오전 중 오전 11시까지 제출','2026-10-12','11:00'],
 ['내일 오후 3시 20분까지 제출','2026-10-12','15:20'],['내일까지 오후 3시 제출','2026-10-12','15:00'],
 ['16일까지 09:40에 제출','2026-10-16','09:40'],['오늘 오후 12시까지 제출','2026-10-11','12:00'],
 ['오늘 오전 12시까지 제출','2026-10-11','00:00'],['2027년 1월 2일까지 제출','2027-01-02','16:00'],
 ['2026-10-16까지 제출','2026-10-16','16:00']
];
for(const [text,date,time] of cases)test(text,()=>{const entries=rules.extract(text,sent);assert.equal(entries.length,1);assert.equal(entries[0].date,date);assert.equal(entries[0].dueTime,time);assert.ok(!('start' in entries[0]));});
test('calendar changes apply to the target date; explicit time wins',()=>{
 const c={defaultPeriods:[{period:4,end:'12:10'}],bellSchedules:[{date:'2026-10-12',periods:[{period:4,end:'11:45'}]}]};
 assert.equal(rules.extract('내일 점심시간 전까지 제출',sent,c)[0].dueTime,'11:45');
 assert.equal(rules.extract('오전 중 제출',sent,c)[0].dueTime,'12:10');
 assert.equal(rules.extract('내일 점심시간 전까지 11:30까지 제출',sent,c)[0].dueTime,'11:30');
 assert.equal(rules.extract('오전 중 제출',sent,{defaultPeriods:[{period:3,end:'11:00'}]})[0].dueTime,'12:05');
});
test('Korean date boundaries and year/leap rollovers',()=>{
 assert.equal(rules.extract('내일까지 제출','2026-12-31T14:59:59Z')[0].date,'2027-01-01');
 assert.equal(rules.extract('내일까지 제출','2026-12-31T15:00:00Z')[0].date,'2027-01-02');
 assert.equal(rules.extract('내일까지 제출','2028-02-28')[0].date,'2028-02-29');
});
test('invalid dates, times, timestamps and non-deadlines are skipped',()=>{
 for(const text of ['2월 30일까지 제출','내일 25:00까지 제출','내일 오후 13시까지 제출','내일 12:60까지 제출','내일 회의','내일까지 제출하지 마세요'])assert.deepEqual(rules.extract(text,sent),[]);
 assert.deepEqual(rules.extract('내일까지 제출',null),[]);assert.deepEqual(rules.extract('내일까지 제출','2026-10-10T10:00:00'),[]);
});
test('multiple deadlines and durable demo dedup, including user deletion',()=>{
 const data={rooms:[{messages:[{id:'m1',sender:'other',text:'내일까지 제출.\n16일까지 회신',createdAt:sent},{id:'m2',sender:'me',text:'내일까지 제출',createdAt:sent}]}],mails:[],deadlines:[]};
 rules.applyDemo(data);assert.equal(data.deadlines.length,3);rules.applyDemo(data);assert.equal(data.deadlines.length,3);
 data.deadlines.shift();const restored=JSON.parse(JSON.stringify(data));rules.applyDemo(restored);assert.equal(restored.deadlines.length,2);
});
test('training time ranges are appointments, not submission deadlines',()=>{
 const text='내일 1시에서 3시까지 교직원 연수가 있습니다.';const events=rules.extractEvents(text,sent);assert.equal(events.length,1);assert.equal(events[0].date,'2026-10-12');assert.equal(events[0].start,'13:00');assert.equal(events[0].end,'15:00');assert.deepEqual(rules.extract(text,sent),[]);
 assert.equal(rules.extractEvents('다음 주 수요일 오전 9시부터 11시까지 회의가 있습니다.',sent)[0].start,'09:00');
 assert.equal(rules.extractEvents('내일 오후 1시~3시 연수',sent)[0].end,'15:00');
 for(const text of ['내일 3시까지 연수 계획서 제출','내일 15:00~14:00 회의','내일 오전 13시~14시 회의','내일 1시~3시 연수 취소'])assert.deepEqual(rules.extractEvents(text,sent),[]);
});
test('demo converts an incorrectly classified existing training and deduplicates appointments',()=>{
 const text='내일 1시에서 3시까지 교직원 연수가 있습니다';const data={rooms:[{messages:[{id:'training',text,createdAt:sent}]}],mails:[],deadlines:[{id:'old-wrong',source:{kind:'message',id:'training'},note:text}],events:[]};rules.applyDemo(data);assert.equal(data.deadlines.length,0);assert.equal(data.events.length,1);rules.applyDemo(data);assert.equal(data.events.length,1);data.events=[];rules.applyDemo(data);assert.equal(data.events.length,0);
});

test('single start notices become one-hour appointments; explicit times and Korean send date win',()=>{
 for(const [text,start,end,date] of [
  ['6시에 교무실로 모여주세요','18:00','19:00','2026-10-11'],
  ['오늘 6시에 교무실로 모여주세요','18:00','19:00','2026-10-11'],
  ['오늘 오전 6시에 교무실로 모여주세요','06:00','07:00','2026-10-11'],
  ['내일 오후 3시 반에 회의','15:30','16:30','2026-10-12'],
  ['다음 주 수요일 09:40에 모여주세요','09:40','10:40','2026-10-14']
 ]){const entries=rules.extractStartEvents(text,sent);assert.equal(entries.length,1);assert.equal(entries[0].start,start);assert.equal(entries[0].end,end);assert.equal(entries[0].date,date);assert.equal(entries[0].type,'personal');assert.deepEqual(rules.extract(text,sent),[]);}
 for(const text of ['오늘 25:00에 모여주세요','오늘 오전 13시에 회의','오늘 10시 회의 취소','오늘 10시까지 모여주세요','오늘 10시에 제출','오늘 회의','오늘 10시부터 11시까지 회의'])assert.deepEqual(rules.extractStartEvents(text,sent),[]);
});
test('one-hour appointments across midnight remain sixty minutes',()=>{
 const e=rules.extractStartEvents('오늘 23:30에 회의',sent);assert.deepEqual(e.map(x=>[x.date,x.start,x.end]),[['2026-10-11','23:30','24:00'],['2026-10-12','00:00','00:30']]);
});
test('existing mail with identical subject/body backfills once and stays deleted after re-query',()=>{
 const text='오늘 6시에 교무실로 모여주세요';const data={mails:[{id:'old-start',title:text,body:text,createdAt:sent,folder:'inbox'}],rooms:[],deadlines:[],events:[]};
 rules.applyDemo(data);assert.equal(data.events.length,1);assert.equal(data.events[0].start,'18:00');assert.equal(data.events[0].end,'19:00');assert.equal(data.deadlines.length,0);assert.equal(data.mails[0].eventId,data.events[0].id);
 rules.applyDemo(data);assert.equal(data.events.length,1);data.events=[];const restored=JSON.parse(JSON.stringify(data));rules.applyDemo(restored);assert.equal(restored.events.length,0);
});

test('every unqualified 1–7시 is afternoon for deadlines and appointments',()=>{
 for(let h=1;h<=7;h++){
  const expected=String(h+12)+':00';
  assert.equal(rules.extract(`내일 ${h}시까지 제출`,sent)[0].dueTime,expected);
  assert.equal(rules.extractStartEvents(`내일 ${h}시에 회의`,sent)[0].start,expected);
  assert.equal(rules.extractEvents(`내일 ${h}시부터 ${h+1}시까지 회의`,sent)[0]?.start, h===7?undefined:expected);
  assert.equal(rules.extract(`내일 오전 ${h}시까지 제출`,sent)[0].dueTime,'0'+h+':00');
  assert.equal(rules.extract(`내일 0${h}:00까지 제출`,sent)[0].dueTime,'0'+h+':00');
 }
 assert.equal(rules.extract('내일 7시 반까지 제출',sent)[0].dueTime,'19:30');
});

test('submission, stated closing time, informing and sending requests are deadlines, not meetings',()=>{
 const at='2026-10-12T01:00:00Z';
 for(const [text,date,time] of [['내일까지 자료를 제출해 주세요.','2026-10-13','16:00'],['마감은 16일 오후 2시입니다.','2026-10-16','14:00'],['오늘 3시까지 회의 결과를 알려주세요.','2026-10-12','15:00'],['다음 주 수요일까지 보내주세요.','2026-10-21','16:00']]){
  const parsed=rules.extract(text,at);assert.equal(parsed.length,1,text);assert.equal(parsed[0].date,date);assert.equal(parsed[0].dueTime,time);assert.equal(rules.extractEvents(text,at).length,0);assert.equal(rules.extractStartEvents(text,at).length,0);
 }
 assert.equal(rules.extract('내일까지 자료를 보내지 않아도 됩니다.',at).length,0);
});
