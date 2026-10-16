/* A recipient-scoped chronological view of explicitly categorized messages. */
(function(root){
 'use strict';
 const stamp=m=>Number.isFinite(m.createdAt)?m.createdAt:Date.parse(`${m.date}T${m.time||'00:00'}:00+09:00`)||0;
 function entries(mails,viewer,now=Date.now()){
  const ids=Array.isArray(viewer)?viewer:[viewer],seen=new Set();
  return (mails||[]).filter(m=>{
   if(!m||m.category!=='homeroom'||m.folder==='trash'||seen.has(m.id)||m.scheduled&&(!Number.isFinite(Date.parse(m.scheduled))||Date.parse(m.scheduled)>now))return false;
   const index=(m.to||[]).findIndex(id=>ids.includes(id));if(index<0||['recalled','scheduled'].includes(m.receipts?.[index]))return false;
   seen.add(m.id);return true;
  }).sort((a,b)=>stamp(a)-stamp(b)||String(a.id).localeCompare(String(b.id)));
 }
 function pinnedItem(mail,date){
  return {title:String(mail.title||'담임').slice(0,150),titleFromMail:true,date,dueTime:'',note:String(mail.body||'').slice(0,1000),done:false,homeroomMail:mail.id,source:{kind:'mail',id:mail.id}};
 }
 const api={entries,stamp,pinnedItem};if(typeof module==='object'&&module.exports)module.exports=api;else root.IeumHomeroom=api;
})(typeof window==='object'?window:globalThis);
