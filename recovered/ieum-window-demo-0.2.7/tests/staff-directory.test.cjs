'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),staff=require('../js/staff-directory.js');
const people=[{id:'a',name:'가교사',department:'교무부',role:'교사',extension:'101'},{id:'b',name:'나교사',department:'생활안전부',role:'교사',extension:'102'}],context={classTeachers:[{className:'1학년 1반',teacher:'a'}],dutySettings:{safetyDepartment:'생활안전부',managers:{safety:['a'],lunch:['a'],study:[]}}};
test('one staff workbook updates eight fields and derives homerooms and duty managers',()=>{
 const result=staff.plan([staff.headers,['가교사','2','3','201','교무부','중식 지도, 자율학습 지도','음악실','합창부'],['나교사','','','202','생활안전부','안전 지도','',''],['새직원','','','301','행정실','급여','','']],people,context);
 assert.deepEqual(result.errors,[]);assert.equal(result.entries.filter(e=>e.isNew).length,1);assert.equal(result.entries[2].role,'행정직원');assert.deepEqual(result.classTeachers,[{className:'2학년 3반',teacher:'a'}]);assert.deepEqual(result.dutySettings.managers,{safety:['b'],lunch:['a'],study:['a']});assert.equal(result.entries[0].specialRoom,'음악실');assert.equal(result.entries[0].club,'합창부');
 const resolved=staff.resolve(result,{'new-staff-row-4':'new-id'});assert.equal(resolved.entries[2].id,'new-id');assert.ok(!('isNew' in resolved.entries[0]));
});
test('blank imported fields clear assignments while omitted staff retain theirs',()=>{
 const r=staff.plan([staff.headers,['가교사','','','','교무부','','','']],people,context);assert.deepEqual(r.errors,[]);assert.deepEqual(r.classTeachers,[]);assert.deepEqual(r.dutySettings.managers.lunch,[]);assert.equal(r.entries[0].extension,'');
 const onlyNew=staff.plan([staff.headers,['신규','3학년','2반','303','교무부','자율학습 담당','','']],people,context);assert.deepEqual(onlyNew.errors,[]);assert.equal(onlyNew.classTeachers.length,2);assert.deepEqual(onlyNew.dutySettings.managers.lunch,['a']);assert.ok(onlyNew.dutySettings.managers.study.includes('new-staff-row-2'));
 const departmentChange=staff.plan([staff.headers,['가교사','','','101','학생생활부','안전 지도','','']],people,context);assert.equal(departmentChange.dutySettings.safetyDepartment,'학생생활부');
});
test('ambiguous names, duplicate homerooms, disabled users and malformed spreadsheets cannot apply',()=>{
 for(const rows of [[['이름']], [staff.headers,['가교사','','2','','교무부','','','']], [staff.headers,['가교사','0','','','교무부','','','']], [staff.headers,['신규','1','1','','교무부','','','']], [staff.headers,['가교사','','','','교무부','','',''],['가교사','','','','교무부','','','']]])assert.ok(staff.plan(rows,people,context).errors.length);
 const same=[...people,{...people[0],id:'dup',extension:'999'}];assert.ok(staff.plan([staff.headers,['가교사','','','','교무부','','','']],same,context).errors.length);assert.deepEqual(staff.plan([staff.headers,['가교사','','','999','교무부','','','']],same,context).errors,[]);
 assert.ok(staff.plan([staff.headers,['가교사','','','101','교무부','','','']],people.map(p=>({...p,disabled:true})),context).errors.length);
});
