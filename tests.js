// Built-in Node assertion library only; no external test packages.
import assert from 'node:assert/strict';
import { applicants, processApplicant, processAdmissions } from './task1.js';
import { results, analyzeResults } from './task2.js';
import { calculateGrade, calculateAverage, calculateGPA } from './gradeUtils.js';
import { studentProfile, profileUpdate, updateProfile, summarizeProfile, compareReferences } from './task3.js';
import Person from './Person.js';
import Student from './Student.js';
import { FacultyMember } from './task4.js';
import { processTranscript, rawData } from './transcriptService.js';
import { createStore } from './registrationData.js';
import { registerLegacy } from './task6.js';
import { registerModern, courseServer, firstSuccessfulCourse } from './task7.js';
import { getJSON, fakeFetch, loadDashboard, fetchWithTimeout, HTTPError, TimeoutError, classifyError } from './task8.js';

let passed = 0;
function check(name, action) {
  action(); passed += 1; console.log(`PASS: ${name}`);
}
async function checkAsync(name, action) {
  await action(); passed += 1; console.log(`PASS: ${name}`);
}
function applicant(changes = {}) { return { ...applicants[0], ...changes }; }
check('T1 supplied data and source unchanged', () => {
  const before = JSON.stringify(applicants);
  const data = processAdmissions(applicants);
  assert.equal(data.summary.validApplicants, 2);
  assert.equal(data.summary.invalidApplicants, 1);
  assert.equal(data.summary.highestMeritApplicant.id, 'A103');
  assert.ok(Math.abs(data.summary.lowestMerit - 83.3) < 1e-9);
  assert.ok(Math.abs(data.summary.averageMerit - 84.45) < 1e-9);
  assert.equal(JSON.stringify(applicants), before);
});
check('T1 eligibility boundaries, selected, waiting, rejected', () => {
  const boundary = { age: '17', matricMarks: '100', intermediateMarks: '60', entryTest: '64' };
  assert.equal(processApplicant(applicant(boundary)).status, 'SELECTED'); // Merit exactly 70.
  assert.equal(processApplicant(applicant({ ...boundary, age: '30', feePaid: 'false' })).status, 'WAITING');
  assert.equal(processApplicant(applicant({ entryTest: '59.99' })).status, 'REJECTED');
  assert.equal(processApplicant(applicant({ intermediateMarks: '59.99' })).status, 'REJECTED');
  assert.equal(processApplicant(applicant({ matricMarks: '0', intermediateMarks: '0', entryTest: '0' })).status, 'REJECTED');
});
check('T1 invalid types, missing values, unsupported program and ranges', () => {
  for (const changes of [{ age: 'twenty' }, { age: '16' }, { age: '31' }, { age: '19.5' },
    { intermediateMarks: '' }, { entryTest: ' ' }, { matricMarks: null }, { matricMarks: true },
    { entryTest: 'Infinity' }, { matricMarks: '-1' }, { matricMarks: '101' },
    { program: 'MBA' }, { feePaid: 'yes' }, { name: '' }, { id: '' }]) {
    const value = processApplicant(applicant(changes));
    assert.equal(value.status, 'INVALID DATA'); assert.equal(value.merit, null);
  }
  assert.equal(processApplicant(null).status, 'INVALID DATA');
  assert.equal(processAdmissions([]).summary.averageMerit, null);
  assert.throws(() => processAdmissions(null), TypeError);
});
check('T2 all grade thresholds and invalid numbers', () => {
  for (const [marks, grade] of [[0, 'F'], [49.99, 'F'], [50, 'C'], [60, 'C+'], [65, 'B-'],
    [70, 'B'], [75, 'B+'], [80, 'A-'], [84.99, 'A-'], [85, 'A'], [100, 'A']]) {
    assert.equal(calculateGrade(marks).grade, grade);
  }
  for (const value of [-1, 101]) assert.throws(() => calculateGrade(value), RangeError);
  for (const value of [NaN, Infinity, null, '80']) assert.throws(() => calculateGrade(value), TypeError);
  assert.equal(calculateAverage([]), null); assert.equal(calculateGPA([]), null);
});
check('T2 ranking, queries, dynamic department, invalid rows, no mutation', () => {
  const before = JSON.stringify(results);
  const data = analyzeResults(results);
  assert.deepEqual(data.queries.topThreeNames, ['Sara', 'Zoya', 'Ali']);
  assert.equal(data.queries.firstAbove85.name, 'Sara');
  assert.equal(data.queries.firstFailedIndex, 2);
  assert.equal(data.queries.anyFailed, true); assert.equal(data.queries.everyMarkValid, true);
  assert.ok(Math.abs(data.average - 448 / 6) < 1e-9);
  assert.equal(data.departments.CS.average, 86.5);
  assert.equal(data.departments.SE.passed, 1);
  assert.equal(JSON.stringify(results), before);
  const changed = analyzeResults([null, { ...results[0], department: 'DS' }, { ...results[2], marks: 101 }]);
  assert.equal(changed.departments.DS.students, 1);
  assert.equal(changed.rejected.length, 2); assert.equal(changed.queries.everyMarkValid, false);
  assert.equal(analyzeResults([]).average, null);
  assert.deepEqual(analyzeResults([]).queries.topThreeNames, []);
});
check('T3 nested merging, reference isolation and falsy values', () => {
  const before = JSON.stringify(studentProfile);
  const updated = updateProfile(studentProfile, profileUpdate);
  assert.equal(updated.address.city, 'Rawalpindi'); assert.equal(updated.address.sector, 'F-10');
  assert.equal(updated.contact.email, 'ali@university.edu'); assert.equal(updated.contact.phone, '03001234567');
  assert.deepEqual(compareReferences(studentProfile, updated), { sameObject: false, sameAddress: false, sameContact: false });
  updated.address.city = 'Lahore'; updated.contact.email = 'other@example.com';
  assert.equal(JSON.stringify(studentProfile), before);
  const falsy = updateProfile(studentProfile, { name: '', marks: 0, scholarship: false, contact: { phone: '' } });
  assert.equal(falsy.name, ''); assert.equal(falsy.marks, 0); assert.equal(falsy.scholarship, false);
  assert.equal(summarizeProfile(falsy).phone, '');
  assert.equal(updateProfile(studentProfile).address.sector, 'F-10');
  assert.throws(() => updateProfile(studentProfile, { address: null }), TypeError);
  assert.throws(() => updateProfile(studentProfile, { id: 999 }), /ID cannot change/);
});
check('T4 inheritance, overriding, call, detached method and bind', () => {
  const s = new Student('Ali', 'a@u.edu', '101', 82);
  const f = new FacultyMember('Sana', 's@u.edu', 'F1', 'CS');
  assert.ok(s instanceof Person); assert.ok(f instanceof Person); assert.ok(!(f instanceof Student));
  assert.match(s.introduce(), /student/); assert.match(f.introduce(), /teach/);
  assert.equal(s.getResult().grade, 'A-');
  assert.match(Person.prototype.introduce.call({ name: 'Guest', email: 'g@u.edu' }), /Guest/);
  const fn = s.introduce; assert.throws(() => fn(), TypeError);
  assert.equal(fn.bind(s)(), s.introduce());
  assert.throws(() => new Student('Ali', 'a@u.edu', '101', -1), RangeError);
});
check('T5 transcript and JSON round trip', () => {
  const { report, json } = processTranscript(rawData);
  assert.equal(report.students[0].average, 77.5);
  assert.ok(Math.abs(report.students[0].gpa - 3.335) < 1e-9);
  assert.deepEqual(JSON.parse(json), report);
  assert.equal(processTranscript('[]').report.studentCount, 0);
  assert.equal(processTranscript('[{"id":1,"name":"A","courses":[]}]').report.students[0].gpa, null);
});
check('T5 malformed JSON, duplicate/missing ID, course code, marks and shape', () => {
  assert.throws(() => processTranscript('{bad'), SyntaxError);
  assert.throws(() => processTranscript('{}'), TypeError);
  assert.throws(() => processTranscript(null), TypeError);
  const row = JSON.parse(rawData)[0];
  assert.throws(() => processTranscript(JSON.stringify([row, row])), /Duplicate/);
  for (const value of [{ ...row, id: undefined }, { ...row, courses: null }, null,
    { ...row, courses: [{ marks: 81 }] }, { ...row, courses: [{ code: 'CS301', marks: '81' }] }]) {
    assert.throws(() => processTranscript(JSON.stringify([value])), TypeError);
  }
  for (const marks of [-1, 101]) {
    assert.throws(() => processTranscript(JSON.stringify([{ ...row, courses: [{ code: 'CS301', marks }] }])), RangeError);
  }
});
// Promise adapter is ONLY test orchestration. Task 6 implementation uses callbacks only.
async function legacyCase(studentId, course, expectedError) {
  const store = createStore();
  const before = JSON.stringify(store);
  let calls = 0;
  await new Promise((resolve, reject) => {
    registerLegacy(store, studentId, course, (error, confirmation) => {
      calls += 1;
      try {
        if (expectedError) { assert.match(error.message, expectedError); assert.equal(JSON.stringify(store), before); }
        else { assert.equal(error, null); assert.equal(confirmation.status, 'REGISTERED'); }
      } catch (failure) { reject(failure); return; }
      resolve();
    });
  });
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.equal(calls, 1);
}
await checkAsync('T6 success callback exactly once', () => legacyCase(101, 'CS401'));
await checkAsync('T6 missing student stops workflow', () => legacyCase(999, 'CS401', /does not exist/));
await checkAsync('T6 missing prerequisite stops workflow', () => legacyCase(102, 'CS401', /Prerequisite/));
await checkAsync('T6 full course stops workflow', () => legacyCase(101, 'CS402', /full/));
await checkAsync('T6 duplicate registration stops workflow', () => legacyCase(103, 'CS401', /already/));
await checkAsync('T6 unknown course and invalid input', async () => {
  await legacyCase(101, 'UNKNOWN', /Course does not exist/);
  await legacyCase(null, 'CS401', /Valid student/);
});
await checkAsync('T7 partial notification failure preserves successful registration', async () => {
  const store = createStore();
  const output = await registerModern(store, 101, 'CS401', { sms: true });
  assert.deepEqual(output.services.map(s => s.status), ['fulfilled', 'rejected', 'fulfilled']);
  assert.equal(output.confirmation.status, 'REGISTERED');
  assert.equal(store.courses[0].seats, 1);
  assert.equal(output.lifecycle.at(-1), 'Registration attempt finished');
  await assert.rejects(registerModern(store, 101, 'CS401'), /already/);
});
await checkAsync('T7 registration errors propagate and do not mutate state', async () => {
  for (const [id, code, message] of [[999, 'CS401', /does not exist/], [102, 'CS401', /Prerequisite/],
    [101, 'CS402', /full/], [101, 'UNKNOWN', /does not exist/], [null, 'CS401', /Valid student/]]) {
    const store = createStore(); const before = JSON.stringify(store);
    await assert.rejects(registerModern(store, id, code), message);
    assert.equal(JSON.stringify(store), before);
  }
});
await checkAsync('T7 Promise.any ignores fast failure, rejects if both fail', async () => {
  const output = await firstSuccessfulCourse(courseServer({}, 1, true), courseServer({ code: 'CS401' }, 5));
  assert.equal(output.code, 'CS401');
  await assert.rejects(firstSuccessfulCourse(courseServer({}, 1, true), courseServer({}, 2, true)), AggregateError);
});
await checkAsync('T7 concurrent registration cannot overbook final seat', async () => {
  const store = createStore(); store.courses[0].seats = 1;
  store.students[1].completed = ['CS301'];
  const outcomes = await Promise.allSettled([registerModern(store, 101, 'CS401'), registerModern(store, 102, 'CS401')]);
  assert.equal(outcomes.filter(o => o.status === 'fulfilled').length, 1);
  assert.equal(store.courses[0].seats, 0);
});
await checkAsync('T8 normal dashboard and empty datasets', async () => {
  const dashboard = await loadDashboard();
  assert.equal(dashboard.totalStudents, 6); assert.equal(dashboard.totalCourses, 1);
  assert.equal(dashboard.highestPerformingStudent.name, 'Sara');
  assert.equal(dashboard.failedStudents, 1); assert.equal(dashboard.departments.SE.average, 55.5);
  const empty = await loadDashboard(async () => ({ ok: true, async json() { return []; } }));
  assert.equal(empty.overallAverageMarks, null); assert.equal(empty.highestPerformingStudent, null);
});
await checkAsync('T8 HTTP 404/500, network and invalid JSON propagate', async () => {
  for (const url of ['/404', '/500']) await assert.rejects(getJSON(url, fakeFetch), HTTPError);
  await assert.rejects(getJSON('/network', fakeFetch), TypeError);
  await assert.rejects(getJSON('/invalid-json', fakeFetch), SyntaxError);
});
await checkAsync('T8 timeout, abort, success, failure and timer cleanup', async () => {
  await assert.rejects(fetchWithTimeout('/slow', 1), TimeoutError);
  assert.deepEqual(await fetchWithTimeout('/slow', 200), { message: 'Slow response' });
  assert.equal((await fetchWithTimeout('/users', 100)).length, 6);
  await assert.rejects(fetchWithTimeout('/500', 100), HTTPError);
  await assert.rejects(fetchWithTimeout('/network', 100), TypeError);
  await assert.rejects(fetchWithTimeout('/invalid-json', 100), SyntaxError);
  await assert.rejects(fetchWithTimeout('/users', -1), RangeError);
  // If finally did not clear the timer, it would abort this captured signal later.
  let observedSignal;
  await fetchWithTimeout('/users', 10, async (url, { signal }) => {
    observedSignal = signal; return { ok: true, async json() { return []; } };
  });
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(observedSignal.aborted, false);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(fakeFetch('/users', { signal: controller.signal }), { name: 'AbortError' });
  assert.equal(classifyError(new TimeoutError(1)), 'TIMEOUT');
});
await checkAsync('T8 dashboard calls start concurrently', async () => {
  const started = [];
  const pending = [];
  const job = loadDashboard(url => {
    started.push(url);
    return new Promise(resolve => pending.push(resolve));
  });
  assert.deepEqual(started, ['/users', '/courses', '/results']);
  pending.forEach(resolve => resolve({ ok: true, async json() { return []; } }));
  await job;
});
await checkAsync('T8 multiple-course student averages and distinct failure counts', async () => {
  const data = {
    '/users': [{ id: 1, name: 'A', department: 'CS' }, { id: 2, name: 'B', department: 'CS' }],
    '/courses': [{ code: 'X' }, { code: 'Y' }],
    '/results': [{ id: 1, course: 'X', marks: 100 }, { id: 1, course: 'Y', marks: 0 },
      { id: 2, course: 'X', marks: 80 }, { id: 2, course: 'Y', marks: 80 }]
  };
  const output = await loadDashboard(async url => ({ ok: true, async json() { return data[url]; } }));
  assert.equal(output.highestPerformingStudent.name, 'B');
  assert.equal(output.departments.CS.students, 2); assert.equal(output.failedStudents, 1);
});
console.log(`\n${passed} test groups passed.`);
