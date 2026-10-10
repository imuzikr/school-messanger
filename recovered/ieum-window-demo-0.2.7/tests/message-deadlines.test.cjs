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
 rules.applyDemo(data);assert.equal(data.deadlines.length,2);rules.applyDemo(data);assert.equal(data.deadlines.length,2);
 data.deadlines.shift();const restored=JSON.parse(JSON.stringify(data));rules.applyDemo(restored);assert.equal(restored.deadlines.length,1);
});
