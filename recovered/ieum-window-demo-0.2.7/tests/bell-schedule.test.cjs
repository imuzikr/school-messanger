'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {generate}=require('../js/bell-schedule.js'),{validate}=require('../server/schedule.cjs'),{lunchTime}=require('../js/message-deadlines.js');
test('40/45/50 minute lessons use fixed ten-minute breaks and skip the complete lunch interval',()=>{
 const starts={40:['08:30','09:20','10:10','11:00','13:00','13:50','14:40'],45:['08:30','09:25','10:20','11:15','13:00','13:55','14:50'],50:['08:30','09:30','10:30','13:00','14:00','15:00','16:00']};
 for(const duration of [40,45,50]){const slots=generate({start:'08:30',duration,count:7,lunchStart:'12:00',lunchEnd:'13:00'});assert.equal(slots.length,8);assert.doesNotThrow(()=>validate(slots));const classes=slots.filter(p=>Number.isInteger(p.period)),minute=t=>Number(t.slice(0,2))*60+Number(t.slice(3));assert.deepEqual(classes.map(p=>p.start),starts[duration]);for(const item of classes){assert.equal(minute(item.end)-minute(item.start),duration);assert.ok(item.end<='12:00'||item.start>='13:00');}}

});
test('lunch may follow three or five lessons and explicit lunch start drives lunch deadlines',()=>{
 for(const lunchStart of ['10:30','12:00']){const slots=generate({start:'08:00',duration:40,count:6,lunchStart,lunchEnd:'13:00'});assert.doesNotThrow(()=>validate(slots));assert.equal(lunchTime('2026-10-12',{defaultPeriods:slots}),lunchStart);}
 assert.throws(()=>validate([{period:1,start:'08:00',end:'08:50'},{period:4.5,start:'08:40',end:'09:30'}]));
 assert.throws(()=>validate([{period:1,start:'09:00',end:'09:50'},{period:2,start:'08:00',end:'08:50'}]));
});
test('invalid or overflowing bulk input never yields a partial schedule',()=>{
 const values={start:'08:00',duration:50,count:7,lunchStart:'12:00',lunchEnd:'13:00'};
 for(const override of [{start:''},{start:'07:00'},{duration:60},{count:0},{count:13},{count:1.5},{lunchStart:'13:30'},{lunchEnd:'18:30'},{count:12},{lunchStart:'08:20'},{lunchEnd:'12:00'}])assert.throws(()=>generate({...values,...override}));
});
