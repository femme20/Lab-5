import { applicants, processAdmissions } from './task1.js';
import { results, analyzeResults } from './task2.js';
import { studentProfile, profileUpdate, updateProfile, summarizeProfile, compareReferences } from './task3.js';
import { demonstrateUsers } from './task4.js';
import { rawData, processTranscript } from './transcriptService.js';
import { createStore } from './registrationData.js';
import { registerLegacy } from './task6.js';
import { registerModern, courseServer, firstSuccessfulCourse } from './task7.js';
import { loadDashboard, getJSON, fakeFetch, fetchWithTimeout, classifyError } from './task8.js';

function show(title, value) {
  console.log(`\n${title}`);
  console.log(JSON.stringify(value, null, 2));
}
show('TASK 1: ADMISSIONS', processAdmissions(applicants));
show('TASK 2: PERFORMANCE', analyzeResults(results));
const updated = updateProfile(studentProfile, profileUpdate);
show('TASK 3: UPDATED PROFILE', updated);
show('TASK 3: REFERENCES (all false)', compareReferences(studentProfile, updated));
show('TASK 3: DESTRUCTURING AND DEFAULTS', summarizeProfile(updated, 'CS student', 'Main campus'));
show('TASK 4: USERS', demonstrateUsers());
try {
  show('TASK 5: TRANSCRIPT', processTranscript(rawData));
} catch (error) {
  console.error(error.name, error.message);
} finally {
  console.log('Transcript attempt completed');
}

// The caller waits only to keep the terminal output in task order.
// The Task 6 service itself uses callbacks only, including its final callback.
registerLegacy(createStore(), 101, 'CS401', afterLegacy);
function afterLegacy(error, confirmation) {
  show('TASK 6: CALLBACK REGISTRATION', error ? { error: error.message } : confirmation);
  runRemaining().catch(error => { console.error(error); process.exitCode = 1; });
}
async function runRemaining() {
  show('TASK 7: PROMISE REGISTRATION (SMS deliberately fails)',
    await registerModern(createStore(), 101, 'CS401', { sms: true }));
  show('TASK 7: FIRST SUCCESSFUL COURSE SERVER', await firstSuccessfulCourse(
    courseServer({ code: 'CS401', server: 'A' }, 1, true),
    courseServer({ code: 'CS401', server: 'B' }, 10)
  ));
  show('TASK 8: DASHBOARD', await loadDashboard());
  for (const url of ['/404', '/500', '/network', '/invalid-json']) {
    try { await getJSON(url, fakeFetch); }
    catch (error) { show(`TASK 8: ${url}`, { type: classifyError(error), message: error.message }); }
  }
  try { await fetchWithTimeout('/slow', 10); }
  catch (error) { show('TASK 8: TIMEOUT', { type: classifyError(error), message: error.message }); }
}
