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


test('period gathering uses target-date bell slots and preserves place; unknown and ambiguous periods stay unregistered',()=>{
 const text='오늘 5교시에 3층 모둠교실로 모여주세요.';
 const context={defaultPeriods:[{period:5,start:'12:00',end:'12:50'}],bellSchedules:[{date:'2026-10-12',periods:[{period:5,start:'13:10',end:'13:55'}]}]};
 const e=rules.extractStartEvents(text,sent,context);assert.equal(e.length,1);assert.deepEqual([e[0].date,e[0].start,e[0].end,e[0].period,e[0].place],['2026-10-11','12:00','12:50',5,'3층 모둠교실']);
 assert.equal(rules.extractStartEvents(text.replace('오늘','내일'),sent,context)[0].start,'13:10');
 assert.equal(rules.extractStartEvents(text,'2026-10-12',context)[0].end,'13:55');
 assert.equal(rules.extractStartEvents(text,'2026-10-13',context)[0].start,'12:00');
 for(const text of ['오늘 8교시에 모여주세요','오늘 5교시와 6교시에 모여주세요','오늘 5~6교시에 모여주세요','오늘 5교시 회의 취소','오늘 5교시에 모이지 마세요'])assert.deepEqual(rules.extractStartEvents(text,sent,context),[]);
 assert.deepEqual(rules.extractStartEvents(text,sent,{...context,bellSchedules:[{date:'2026-10-11',periods:[]}]}),[]);
 assert.deepEqual(rules.extractStartEvents(text,sent,{defaultPeriods:[{period:5,start:'12:00',end:'11:50'}]}),[]);
 assert.deepEqual(rules.extractStartEvents(text,sent),[]);
 const mixedText=text+'\n오늘 6시에 교무실로 모여주세요',oldKey=rules.sourceKey('mail-start-event','mixed','me',0);
 const mixed={...context,rooms:[],mails:[{id:'mixed',title:'안내',body:mixedText,createdAt:sent,folder:'inbox'}],events:[{id:'old-clock',start:'18:00',source:{kind:'mail',id:'mixed'}}],autoDeadlineSources:{[oldKey]:'old-clock'},deadlines:[]};rules.applyDemo(mixed);assert.equal(mixed.events.length,2);assert.equal(mixed.events.filter(e=>e.start==='18:00').length,1);assert.equal(mixed.events.filter(e=>e.period===5).length,1);
 const data={...context,rooms:[],mails:[{id:'old-period',title:text,body:text,createdAt:sent,folder:'inbox'}],events:[],deadlines:[]};rules.applyDemo(data);assert.equal(data.events.length,1);assert.equal(data.deadlines.length,0);assert.equal(data.mails[0].eventId,data.events[0].id);rules.applyDemo(data);assert.equal(data.events.length,1);data.events=[];rules.applyDemo(data);assert.equal(data.events.length,0);
});


test('polite meeting invitations use period seven and standalone floor locations; existing mail backfills once',()=>{
 const at='2026-10-11T19:12:00Z',text='오늘 7교시에 3층에서 뵙겠습니다.';
 const context={defaultPeriods:[{period:7,start:'14:00',end:'14:50'}],bellSchedules:[{date:'2026-10-12',periods:[{period:7,start:'15:10',end:'15:55'}]}]};
 for(const verb of ['뵙겠습니다','뵙겠어요','뵈어요','뵐게요','봅시다']){const e=rules.extractStartEvents(text.replace('뵙겠습니다',verb),at,context);assert.equal(e.length,1);assert.deepEqual([e[0].date,e[0].start,e[0].end,e[0].period,e[0].place],['2026-10-12','15:10','15:55',7,'3층']);}
 const hourly=rules.extractStartEvents('오늘 오후 3시에 3층에서 뵙겠습니다.',at,context);assert.equal(hourly[0].start,'15:00');assert.equal(hourly[0].place,'3층');
 for(const text of ['오늘 7교시에 3층에서 뵙지 않겠습니다','오늘 7교시에 3층에서 못 뵙겠습니다','오늘 7교시에 뵙지 못합니다'])assert.deepEqual(rules.extractStartEvents(text,at,context),[]);
 assert.deepEqual(rules.extractStartEvents('오늘 7교시에 3층에서 뵙겠습니다 취소',at,context),[]);
 const data={...context,mails:[{id:'user-old-seven',folder:'sent',title:text,body:text,createdAt:new Date(at).getTime()}],rooms:[],events:[],deadlines:[]};rules.applyDemo(data);assert.equal(data.events.length,1);assert.equal(data.events[0].place,'3층');assert.equal(data.mails[0].eventId,data.events[0].id);rules.applyDemo(data);assert.equal(data.events.length,1);data.events=[];rules.applyDemo(data);assert.equal(data.events.length,0);
});


test('gathering and coming invitations require a usable time or period; cancellation and bare invitations are skipped',()=>{
 const at='2026-10-12T01:00:00Z',context={defaultPeriods:[{period:7,start:'14:00',end:'14:50'}]};
 for(const verb of ['모이겠습니다','모입니다','오세요','오십시오','와 주세요','와 주십시오']){const text=`오늘 7교시에 3층으로 ${verb}.`,events=rules.extractStartEvents(text,at,context);assert.equal(events.length,1,text);assert.deepEqual([events[0].date,events[0].start,events[0].end,events[0].place],['2026-10-12','14:00','14:50','3층']);assert.equal(rules.extract(text,at,context).length,0);assert.deepEqual(rules.extractStartEvents(verb,at,context),[]);}
 assert.equal(rules.extractStartEvents('내일 오후 3시에 교무실로 오세요.',at,context)[0].start,'15:00');
 for(const text of ['오늘 7교시에 모이지 않겠습니다','오늘 7교시에 오지 마세요','오늘 7교시에 오세요 취소','오늘 8교시에 오세요'])assert.deepEqual(rules.extractStartEvents(text,at,context),[]);
});

test('Friday disinfection and maintenance announcements become timed appointments',()=>{
 const at='2026-10-15T01:00:00Z';
 for(const activity of ['전체 소독','방역','청소','시설 점검']){
  const text=`금요일 16시에 ${activity}이 있습니다.`,events=rules.extractStartEvents(text,at);assert.equal(events.length,1,text);assert.deepEqual([events[0].date,events[0].start,events[0].end],['2026-10-16','16:00','17:00']);assert.deepEqual(rules.extract(text,at),[]);
 }
 assert.equal(rules.extractStartEvents('금요일 16시에 전체 소독이 있습니다.','2026-10-16T01:00:00Z')[0].date,'2026-10-16');
 assert.equal(rules.extractStartEvents('금요일 16시에 전체 소독이 있습니다.','2026-10-17T01:00:00Z')[0].date,'2026-10-23');
 assert.equal(rules.extractStartEvents('다음 주 금요일 오후 4시에 방역이 있습니다.',at)[0].date,'2026-10-23');
 const range='금요일 16시부터 18시까지 전체 소독이 있습니다.';assert.deepEqual(rules.extractEvents(range,at).map(e=>[e.date,e.start,e.end]),[['2026-10-16','16:00','18:00']]);assert.deepEqual(rules.extract(range,at),[]);
 for(const text of ['금요일 16시에 소독이 없습니다.','금요일 16시에 소독이 없어요.','금요일 16시에 소독은 취소되었습니다.','금요일 16시에 소독을 하지 않습니다.','금요일 16시에 소독이 다음 주로 연기됩니다.','전체 소독이 있습니다.','금요일 16시에 자료가 있습니다.','금요일 16시까지 소독 신청서를 제출해 주세요.'])assert.deepEqual(rules.extractStartEvents(text,at),[],text);
});
test('maintenance backfill preserves old clock, period and range ledger indices and deleted entries',()=>{
 const at='2026-10-15T01:00:00Z',context={defaultPeriods:[{period:5,start:'12:00',end:'12:50'}]};
 const text='금요일 16시에 전체 소독이 있습니다.\n금요일 14시에 회의가 있습니다.\n금요일 5교시에 모이겠습니다.';
 const legacy=rules.extractStartEvents(text,at,context).filter(e=>!e.note.includes('소독')),source={kind:'mail',id:'user-maintenance-old'};
 const data={...context,mails:[{id:source.id,body:text,createdAt:at,folder:'inbox'}],rooms:[],events:[],deadlines:[],autoDeadlineSources:{}};
 legacy.forEach((e,i)=>{const id='old-'+i;data.events.push({...e,id,source});data.autoDeadlineSources[rules.sourceKey('mail-start-event',source.id,'me',i)]=id;});
 data.events=data.events.filter(e=>e.id!=='old-0');rules.applyDemo(data);assert.equal(data.events.length,2);assert.ok(!data.events.some(e=>e.id==='old-0'));assert.equal(data.events.find(e=>e.id==='old-1').period,5);assert.equal(data.events.filter(e=>e.note.includes('소독')).length,1);rules.applyDemo(data);assert.equal(data.events.length,2);
 const ranges=rules.extractEvents('금요일 16시부터 18시까지 소독.\n금요일 10시부터 11시까지 회의.',at);assert.ok(ranges[0].note.includes('회의'));assert.ok(ranges[1].note.includes('소독'));
});

test('multi-sentence event announcements include opening and retirement ceremonies',()=>{
 const at='2026-10-16T01:00:00Z',text='내일 2시에 행사가 시작됩니다. 내일 3시에 의화제 개회식이 있습니다. 내일 4시에 퇴임식이 진행됩니다.';
 const entries=rules.extractStartEvents(text,at);assert.deepEqual(entries.map(e=>[e.date,e.start,e.end]),[['2026-10-17','14:00','15:00'],['2026-10-17','15:00','16:00'],['2026-10-17','16:00','17:00']]);assert.ok(entries[1].title.includes('의화제 개회식'));assert.deepEqual(rules.extract(text,at),[]);assert.equal(rules.extractStartEvents(text+'\n'+text,at).length,3);
 for(const phrase of ['의화제가 열립니다','새 프로그램이 시작됩니다','기념식이 있습니다','졸업식이 진행됩니다','시상식이 개최됩니다'])assert.equal(rules.extractStartEvents('내일 3시에 '+phrase,at)[0].start,'15:00',phrase);
 for(const phrase of ['개회식이 취소되었습니다','퇴임식은 연기됩니다','졸업식이 없습니다','개회식 자료가 있습니다','소식이 있습니다','지식이 있습니다','자료가 있습니다','개회식 참가 신청서를 3시까지 제출해 주세요'])assert.deepEqual(rules.extractStartEvents('내일 3시에 '+phrase,at),[],phrase);
 assert.deepEqual(rules.extractEvents('내일 3시부터 4시까지 퇴임식이 진행됩니다.',at).map(e=>[e.start,e.end]),[['15:00','16:00']]);
});
test('new ceremony backfill appends after existing maintenance and legacy ledger entries',()=>{
 const at='2026-10-16T01:00:00Z',body='내일 3시에 개회식이 있습니다.\n내일 4시에 전체 소독이 있습니다.\n내일 2시에 행사가 시작됩니다.',source={kind:'mail',id:'user-ceremonies'};
 const entries=rules.extractStartEvents(body,at);assert.deepEqual(entries.map(e=>e.start),['14:00','16:00','15:00']);
 const data={mails:[{id:source.id,body,createdAt:at,folder:'inbox'}],rooms:[],deadlines:[],events:[],autoDeadlineSources:{}};
 entries.slice(0,2).forEach((entry,i)=>{const id='existing-'+i;data.events.push({...entry,id,source});data.autoDeadlineSources[rules.sourceKey('mail-start-event',source.id,'me',i)]=id;});data.events=data.events.filter(e=>e.id!=='existing-1');
 rules.applyDemo(data);assert.equal(data.events.length,2);assert.ok(data.events.some(e=>e.id==='existing-0'&&e.start==='14:00'));assert.equal(data.events.filter(e=>e.start==='15:00').length,1);assert.ok(!data.events.some(e=>e.start==='16:00'));rules.applyDemo(data);assert.equal(data.events.length,2);
});

test('mail titles are authoritative for deadlines, ranges and period events without changing extraction',()=>{
 for(const title of ['기타','행사','오늘의 업무 안내']){
  const data={mails:[{id:'titles',title,body:'오늘까지 보내주세요.\n내일 2시에 행사가 시작됩니다.\n내일 4시부터 5시까지 회의가 있습니다.\n오늘 5교시에 모여주세요.',folder:'sent',createdAt:sent}],events:[],deadlines:[],rooms:[]};
  data.defaultPeriods=[{period:5,start:'13:00',end:'13:45'}];rules.applyDemo(data);assert.equal(data.deadlines.length,1);assert.equal(data.events.length,3);
  for(const e of [...data.events,...data.deadlines]){assert.equal(e.title,title);assert.equal(e.titleFromMail,true);assert.ok(e.note);}
 }
 const entry={title:'내일 회의'};assert.equal(rules.withSourceTitle(entry,'message',{title:'기타'}),entry);assert.equal(rules.withSourceTitle(entry,'mail',{title:'  '}),entry);
});
test('existing automatic mail titles migrate without moving, restoring, duplicating or resetting completion',()=>{
 const data={mails:[{id:'legacy-title',title:'기타',body:'오늘까지 보내주세요. 내일 2시에 행사가 시작됩니다.',folder:'sent',createdAt:sent}],rooms:[],events:[],deadlines:[]};rules.applyDemo(data);
 for(const item of [...data.events,...data.deadlines]){delete item.titleFromMail;item.title='예전 본문 제목';item.date='2026-11-01';}
 data.events[0].start='17:15';data.events[0].end='18:30';data.deadlines[0].dueTime='18:00';data.deadlines[0].done=true;
 const ids=[...data.events,...data.deadlines].map(e=>e.id);rules.applyDemo(data);assert.deepEqual([...data.events,...data.deadlines].map(e=>e.id),ids);assert.ok([...data.events,...data.deadlines].every(e=>e.title==='기타'&&e.date==='2026-11-01'));
 assert.equal(data.events[0].start,'17:15');assert.equal(data.deadlines[0].dueTime,'18:00');assert.equal(data.deadlines[0].done,true);
 data.events=[];rules.applyDemo(data);assert.equal(data.events.length,0);
});
