/* Pure local rules shared by the LAN server and the offline demo. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.IeumDeadlines=api;})(typeof globalThis==='object'?globalThis:this,()=>{
 'use strict';
 const pad=n=>String(n).padStart(2,'0');
 const key=d=>d.toISOString().slice(0,10);
 const valid=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T00:00:00Z'))&&key(new Date(s+'T00:00:00Z'))===s;
 const add=(s,n)=>key(new Date(Date.parse(s+'T00:00:00Z')+n*86400000));
 function sentDate(value){
  if(typeof value==='string'&&valid(value))return value;
  // Zone-less timestamps are ambiguous; never fall back to the query date.
  if(typeof value==='string'&&!/(Z|[+-]\d{2}:?\d{2})$/.test(value))return null;
  if(value===null||value===undefined||value==='')return null;
  const ms=new Date(value).getTime();return Number.isFinite(ms)?key(new Date(ms+9*3600000)):null;
 }
 function lunchTime(date,context={}){
  const periods=(context.bellSchedules||[]).find(s=>s.date===date)?.periods||(context.deadlineDefaultPeriodsChanged===false?undefined:context.defaultPeriods);
  return periods?.find(p=>Number(p.period)===4)?.end?.match(/^([01]\d|2[0-3]):[0-5]\d$/)?.[0]||'12:05';
 }
 function extract(text,sentAt,context={}){
  const base=sentDate(sentAt);if(!base||typeof text!=='string')return [];
  const result=[];
  // Sentence boundaries retain dotted numeric dates and HH:mm times.
  for(const clause of text.slice(0,100000).split(/\n+|[!?。]+|\.(?=\s|$)/)){
   if(!/까지|마감|오전\s*중/.test(clause))continue;
   if(/(?:마감|제출|등록|신청).{0,8}(?:취소|철회)|(?:제출|등록|신청)(?:하지\s*마|할\s*필요\s*없)/.test(clause))continue;
   let date=base,m,hasDate=false;
   if((m=clause.match(/(?:(\d{4})\s*년\s*)?(\d{1,2})\s*월\s*(\d{1,2})\s*일/))){date=`${m[1]||base.slice(0,4)}-${pad(m[2])}-${pad(m[3])}`;hasDate=true;}
   else if((m=clause.match(/(\d{4})-(\d{2})-(\d{2})/))){date=m[0];hasDate=true;}
   else if((m=clause.match(/(이번|다음)\s*주\s*([월화수목금토일])요일/))){const dow=new Date(base+'T00:00:00Z').getUTCDay();date=add(base,-((dow+6)%7)+(m[1]==='다음'?7:0)+'월화수목금토일'.indexOf(m[2]));hasDate=true;}
   else if((m=clause.match(/오늘|내일|모레/))){date=add(base,{오늘:0,내일:1,모레:2}[m[0]]);hasDate=true;}
   else if((m=clause.match(/(?:^|[^\d])(\d{1,2})\s*일/))){date=base.slice(0,8)+pad(m[1]);hasDate=true;}
   else if((m=clause.match(/([월화수목금토일])요일/))){const dow=(new Date(base+'T00:00:00Z').getUTCDay()+6)%7;date=add(base,('월화수목금토일'.indexOf(m[1])-dow+7)%7);hasDate=true;}
   if(!valid(date))continue;
   let dueTime='',rule='date';
   // Explicit time must be associated with the deadline, not a meeting earlier in the sentence.
   m=clause.match(/(오전|오후)?\s*(\d{1,2})(?::(\d{2})|\s*시(?:\s*(\d{1,2})\s*분|\s*(반))?)\s*(?:전\s*)?(?:까지|마감)/);
   if(!m){const times=[...clause.matchAll(/(오전|오후)?\s*(\d{1,2})(?::(\d{2})|\s*시(?:\s*(\d{1,2})\s*분|\s*(반))?)/g)];if(times.length===1)m=times[0];}
   if(m){let hour=Number(m[2]),minute=Number(m[3]||m[4]||(m[5]?30:0));if(m[1]){if(hour<1||hour>12)continue;hour=hour%12+(m[1]==='오후'?12:0);}if(hour>23||minute>59)continue;dueTime=pad(hour)+':'+pad(minute);rule='explicit';}
   else if(/오전\s*중|점심\s*시간\s*전\s*까지/.test(clause)){dueTime=lunchTime(date,context);rule='lunch';}
   else if(hasDate){dueTime='16:00';}
   else continue;
   result.push({date,dueTime,rule,title:clause.trim().slice(0,150),note:clause.trim().slice(0,1000)});
  }
  return result;
 }
 const sourceKey=(kind,id,owner,index)=>JSON.stringify([kind,id,owner,index]);
 function applyDemo(data,owner='me'){
  data.autoDeadlineSources ||= {};data.deadlines ||= [];
  const sources=[];
  for(const room of data.rooms||[])for(const m of room.messages||[])sources.push({kind:'message',id:m.id,text:m.text,at:m.createdAt??m.date});
  for(const m of data.mails||[])if(m.folder!=='trash'&&!m.notice&&!m.calendarEvent&&!m.scheduleAnnouncement&&!m.scheduled)sources.push({kind:'mail',id:m.id,text:(m.title||'')+'\n'+m.body,at:m.createdAt??m.date,mail:m});
  for(const item of data.deadlines)if(item.rule==='lunch')item.dueTime=lunchTime(item.date,data);
  for(const s of sources)extract(s.text,s.at,data).forEach((d,i)=>{const k=sourceKey(s.kind,s.id,owner,i);if(data.autoDeadlineSources[k])return;const id='auto-'+encodeURIComponent(k);data.autoDeadlineSources[k]=id;data.deadlines.push({id,...d,done:false,source:{kind:s.kind,id:s.id}});if(s.mail&&!s.mail.eventId)s.mail.eventId=id;});
 }
 return {extract,sentDate,lunchTime,sourceKey,applyDemo};
});
