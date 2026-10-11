'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {summarize}=require('../js/schedule-summary.js');
test('offline summary condenses tasks, extracts places and preparations, uses edited calendar times',()=>{
 const e={title:'오늘 6시에 교무실로 모여주세요',note:'오늘 6시에 교무실로 모여주세요',source:{kind:'mail',id:'a'},date:'2026-10-14',start:'17:00',end:'18:30'};
 assert.deepEqual(summarize(e,'회의 자료를 미리 확인해 주세요.'),{task:'모임',date:'2026-10-14',time:'17:00 – 18:30',place:'교무실',preparation:'회의 자료 미리 확인'});
 const deadline=summarize({title:'내일 오후 2시까지 계획서를 제출해 주세요.',date:'2026-10-16',dueTime:'15:15'});
 assert.equal(deadline.task,'계획서 제출');assert.equal(deadline.time,'15:15까지 (마감)');assert.equal(deadline.place,'미기재');
 const manual=summarize({title:'교과협의회',date:'2026-10-11',start:'09:00',end:'10:00',place:'도서관',note:'회의 자료를 미리 확인해 주세요.'});
 assert.equal(manual.task,'교과협의회');assert.equal(manual.preparation,'회의 자료 미리 확인');
 const range=summarize({title:'내일 1시부터 3시까지 도서관에서 교직원 연수가 있습니다.',date:'2026-10-12',start:'13:00',end:'15:00'});assert.equal(range.task,'교직원 연수');assert.equal(range.place,'도서관');
});
test('summary does not invent locations or take another appointment’s place/preparation',()=>{
 const s=summarize({title:'내일까지 자료를 제출해 주세요',date:'2026-10-12',dueTime:'16:00',source:{kind:'mail',id:'a'}},'내일 3시에 강당에서 회의 자료를 준비해 주세요.');
 assert.equal(s.place,'미기재');assert.equal(s.preparation,'별도 안내 없음');assert.equal(s.task,'자료 제출');
 assert.equal(summarize({title:'<script>alert(1)</script>',date:'2026-10-12'}).time,'시간 미기재');
});


test('calendar titles omit relative dates and original times without rewriting messages or manual titles',()=>{
 const {calendarTitle}=require('../js/schedule-summary.js');
 for(const [title,label] of [['내일 오후 6시까지 계획서를 제출해 주세요.','계획서 제출'],['내일 1시에서 3시까지 교직원 연수가 있습니다.','교직원 연수'],['오늘 7교시에 3층으로 오세요.','모임'],['오늘 5교시에 3층 모둠교실로 모여주세요.','모임']]){const e={title,source:{kind:'mail',id:'a'},date:'2026-10-12',start:'13:15',end:'14:15'};assert.equal(calendarTitle(e),label);assert.equal(e.title,title);assert.equal(e.start,'13:15');}
 assert.equal(calendarTitle({title:'내일 발표 준비'}),'내일 발표 준비');
 assert.equal(calendarTitle({title:'오늘 3시',source:{kind:'mail',id:'a'}}),'일정');
});
