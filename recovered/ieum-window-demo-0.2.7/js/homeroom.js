/* A recipient-scoped chronological view of explicitly categorized messages. */
(function(root){
 'use strict';
 const stamp=m=>Number.isFinite(m.createdAt)?m.createdAt:Date.parse(`${m.date}T${m.time||'00:00'}:00+09:00`)||0;
 function entries(mails,viewer,now=Date.now()){
  const ids=Array.isArray(viewer)?viewer:[viewer],seen=new Set();
  return (mails||[]).filter(m=>{
   if(!m||m.category!=='homeroom'||m.folder==='trash'||m.homeroomHidden||seen.has(m.id)||m.scheduled&&(!Number.isFinite(Date.parse(m.scheduled))||Date.parse(m.scheduled)>now))return false;
   const index=(m.to||[]).findIndex(id=>ids.includes(id));if(index<0||['recalled','scheduled'].includes(m.receipts?.[index]))return false;
   seen.add(m.id);return true;
  }).sort((a,b)=>stamp(a)-stamp(b)||String(a.id).localeCompare(String(b.id)));
 }
 function pinnedItem(mail,date){
  return {title:String(mail.title||'담임').slice(0,150),titleFromMail:true,date,dueTime:'',note:String(mail.body||'').slice(0,1000),done:false,homeroomMail:mail.id,source:{kind:'mail',id:mail.id}};
 }
 function seedDemo(data,date){
  if(data.homeroomSamplesVersion===1)return;
  const tomorrow=new Date(date+'T12:00:00Z');tomorrow.setUTCDate(tomorrow.getUTCDate()+1);const next=`${tomorrow.getUTCFullYear()}년 ${tomorrow.getUTCMonth()+1}월 ${tomorrow.getUTCDate()}일`;
  const samples=[['생활기록부 확인','학급별 생활기록부의 누락된 항목을 확인해 주세요. 확인 후 담당자에게 회신해 주세요.'],['학부모 상담 일정',next+' 오후 2시부터 오후 3시까지 학부모 상담을 진행합니다. 상담 자료를 준비해 주세요.'],['학급 현황 제출',next+' 오후 4시까지 학급 현황 자료를 제출해 주세요.'],['학급 전달 사항','학생들에게 안내문을 전달한 뒤 확인 여부를 기록해 주세요. 메모하기에 회신할 내용을 남겨 보세요.']];
  const people=(data.people||[]).filter(p=>p.id!=='me');
  samples.forEach(([title,body],i)=>{const id='demo-homeroom-'+(i+1);if(data.mails.some(m=>m.id===id))return;data.mails.push({id,from:people[i%Math.max(1,people.length)]?.id||'me',to:['me'],cc:[],title:'[샘플] '+title,body,category:'homeroom',folder:'inbox',files:[],date,time:`09:${String(i*10).padStart(2,'0')}`,createdAt:Date.parse(date+`T09:${String(i*10).padStart(2,'0')}:00+09:00`),receipts:['read'],unread:false,important:false,demoHomeroom:true});});
  data.homeroomSamplesVersion=1;
 }
 const api={entries,stamp,pinnedItem,seedDemo};if(typeof module==='object'&&module.exports)module.exports=api;else root.IeumHomeroom=api;
})(typeof window==='object'?window:globalThis);
