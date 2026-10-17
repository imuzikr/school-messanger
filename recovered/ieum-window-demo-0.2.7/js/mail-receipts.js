/* Receipt events are notifications, never automatic reply messages. */
(function(root){
 'use strict';
 const key=(receipt,owner)=>JSON.stringify([owner,receipt.mail,receipt.recipient,receipt.readAt||0]);
 function changes(before,after){
  const previous=new Map((before||[]).filter(m=>m.from==='me').map(m=>[m.id,m])),result=[],seen=new Set();
  for(const mail of after||[]){const old=previous.get(mail.id);if(mail.from!=='me'||!old)continue;const statuses=new Map((old.to||[]).map((id,i)=>[id,old.receipts?.[i]]));
   for(const [i,recipient] of (mail.to||[]).entries()){const id=JSON.stringify([mail.id,recipient]);if(recipient==='me'||seen.has(id)||mail.receipts?.[i]!=='read'||!['unread','scheduled'].includes(statuses.get(recipient)))continue;seen.add(id);result.push({mail:mail.id,recipient,subject:mail.title||'기타'});}
  }return result;
 }
 function message(receipt){const name=String(receipt.name||'수신자'),suffix=name.endsWith('님')?'이':'님이';return {title:'메시지 수신 확인',body:`${name}${suffix} 메시지를 수신했습니다. · ${receipt.subject||'기타'}`};}
 const api={key,changes,message};if(typeof module==='object'&&module.exports)module.exports=api;else root.IeumMailReceipts=api;
})(typeof window==='object'?window:globalThis);
