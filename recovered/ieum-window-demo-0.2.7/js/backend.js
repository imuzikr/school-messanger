/* Installed clients send typed, authorized operations to the LAN server.
   Authentication tokens stay in Electron's main process, never in this renderer. */
(function(){
const clone=v=>JSON.parse(JSON.stringify(v));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const keys=['rooms','mails','events','notes','deadlines','tasks','shortcuts'];
class IeumBackend{
 constructor(native,callbacks){this.native=native;this.callbacks=callbacks;this.active=false;this.baseline=null;this.queue=Promise.resolve();this.pending=0;this.generation=0;this.refreshTimer=null;this.native.subscribe(event=>this.onEvent(event));}
 async init(){this.connection=await this.native.connection();if(this.connection?.error)this.connection=null;if(!this.connection)return null;const result=await this.native.request('/bootstrap');if(result.error)return null;this.activate(result);return result;}
 activate(result){this.user=result.user;this.active=true;this.baseline=clone(result.data);this.callbacks.data(result);}
 async login(username,password){const result=await this.native.request('/login',{username,password});if(result.error)throw new Error(result.error);this.user=result.user;if(!result.user.mustChange){const snapshot=await this.native.request('/bootstrap');if(snapshot.error)throw new Error(snapshot.error);this.activate(snapshot);}return result.user;}
 async changePassword(current,password){const result=await this.native.request('/password',{current,password});if(result.error)throw new Error(result.error);await this.refresh();}
 async logout(){this.active=false;this.generation++;this.baseline=null;await this.native.request('/logout',{});}
 diff(before,after){const operations=[];if(!before)return operations;
  if(!same(before.classTeachers,after.classTeachers))operations.push({type:'classes.upsert',value:{classes:after.classTeachers||[]}});
  const oldRooms=new Map(before.rooms.map(r=>[r.id,r]));
  for(const room of after.rooms){const old=oldRooms.get(room.id);if(!old)operations.push({type:'room.create',value:room});else if(room.pinned!==old.pinned||room.muted!==old.muted||old.unread>0&&room.unread===0)operations.push({type:'room.update',id:room.id,pinned:room.pinned,muted:room.muted,read:room.unread===0});
   const messages=new Map((old?.messages||[]).map(m=>[m.id,m]));for(const m of room.messages){const prev=messages.get(m.id);if(!prev&&m.sender==='me')operations.push({type:'message.send',room:room.id,value:m});else if(prev&&prev.liked!==m.liked)operations.push({type:'message.like',id:m.id,liked:m.liked});}}
  for(const room of before.rooms)if(!after.rooms.some(r=>r.id===room.id))operations.push({type:'room.leave',id:room.id});
  const oldMails=new Map(before.mails.map(m=>[m.id,m]));for(const m of after.mails){const old=oldMails.get(m.id);if(!old&&m.from==='me')operations.push({type:'mail.send',value:m});else if(old&&(old.folder!==m.folder||old.important!==m.important||old.unread!==m.unread||old.eventId!==m.eventId||!same(old.receipts,m.receipts)))operations.push({type:'mail.update',id:m.id,folder:m.folder,important:m.important,read:!m.unread,eventId:m.eventId,recall:m.receipts.some((r,i)=>r==='recalled'&&old.receipts[i]!=='recalled')});}
  if(!same(before.defaultPeriods,after.defaultPeriods))operations.push({type:'schedule.upsert',value:{periods:after.defaultPeriods}});
  for(const schedule of after.bellSchedules||[]){const old=(before.bellSchedules||[]).find(s=>s.date===schedule.date);if(!same(old,schedule))operations.push({type:'schedule.upsert',value:schedule});}
  for(const schedule of before.bellSchedules||[])if(!(after.bellSchedules||[]).some(s=>s.date===schedule.date))operations.push({type:'schedule.delete',value:{date:schedule.date}});
  const previousEvents=new Map(before.events.map(e=>[e.id,e]));for(const event of after.events){if(!event.readonly&&!(event.noticeMail&&!previousEvents.has(event.id))&&!same(previousEvents.get(event.id),event))operations.push({type:'event.upsert',value:event});}for(const event of before.events)if(!event.readonly&&!after.events.some(e=>e.id===event.id))operations.push({type:'event.delete',id:event.id});
  for(const kind of ['notes','deadlines','tasks','shortcuts']){const previous=new Map((before[kind]||[]).map(i=>[i.id,i]));for(const value of after[kind]||[])if(!same(previous.get(value.id),value))operations.push({type:'item.upsert',kind,value});for(const value of before[kind]||[])if(!(after[kind]||[]).some(i=>i.id===value.id))operations.push({type:'item.delete',id:value.id});}
  // Event links are applied after the corresponding event has been inserted.
  const mailUpdates=operations.filter(op=>op.type==='mail.update'&&op.eventId||op.type==='mail.send'&&(op.value.calendarEvent||op.value.scheduleAnnouncement));for(const op of mailUpdates){operations.splice(operations.indexOf(op),1);operations.push(op);}
  return operations;
 }
 sync(data){if(!this.active)return Promise.resolve(false);const snapshot=clone(data),operations=this.diff(this.baseline,snapshot);this.baseline=snapshot;if(!operations.length)return Promise.resolve(true);const generation=this.generation;this.pending++;this.callbacks.status('저장 중');
  const job=this.queue.then(async()=>{if(generation!==this.generation)return false;try{const result=await this.native.request('/sync',{operations});if(result.error)throw new Error(result.error);this.callbacks.status('연결됨');return true;}catch(error){this.generation++;this.callbacks.error(error.message);return false;}}).finally(async()=>{this.pending--;if(!this.pending){clearTimeout(this.refreshTimer);this.refreshTimer=null;await this.refresh();}});this.queue=job.catch(()=>false);return job;
 }
 scheduleRefresh(){if(this.refreshTimer||!this.active)return;this.refreshTimer=setTimeout(()=>{this.refreshTimer=null;this.refresh();},0);}
 async refresh(){if(this.pending||!this.user)return;try{const result=await this.native.request('/bootstrap');if(result.error){if(result.status===401){this.active=false;this.callbacks.expired();}else this.callbacks.status('연결 확인 필요');return;}this.activate(result);this.callbacks.status('연결됨');}catch{this.callbacks.status('연결 끊김');}}
 onEvent(event){if(['changed','presence','ready','connected'].includes(event.kind))this.scheduleRefresh();if(event.kind==='connected')this.callbacks.status('연결됨');if(event.kind==='disconnected')this.callbacks.status('재연결 중');if(event.kind==='expired'||event.kind==='logout'){this.active=false;this.user=null;this.baseline=null;this.callbacks.expired();}}
}
window.IeumBackend=IeumBackend;
})();
