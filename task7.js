import { prepareContext, loadStudentData, loadCourseData, verifyPrerequisites,
  verifySeats, commitRegistration } from './registrationData.js';

// This helper returns a Promise, never a function retaining private state.
function delayed(operation, input) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try { resolve(operation(input)); } catch (error) { reject(error); }
    }, 5);
  });
}
export function getStudent(context) { return delayed(loadStudentData, context); }
export function getCourse(context) { return delayed(loadCourseData, context); }
export function checkPrerequisites(context) { return delayed(verifyPrerequisites, context); }
export function checkSeats(context) { return delayed(verifySeats, context); }
export function registerStudent(context) { return delayed(commitRegistration, context); }
function deliverService({ service, confirmation, fail }) {
  if (fail) throw new Error(`${service} unavailable`);
  return { service, studentId: confirmation.studentId, status: 'SENT' };
}
export function sendEmail(confirmation, fail = false) {
  return delayed(deliverService, { service: 'Email', confirmation, fail });
}
export function sendSMS(confirmation, fail = false) {
  return delayed(deliverService, { service: 'SMS', confirmation, fail });
}
export function writeAuditLog(confirmation, fail = false) {
  return delayed(deliverService, { service: 'Audit', confirmation, fail });
}
export function postRegistration(confirmation, failures = {}) {
  const services = ['Email', 'SMS', 'Audit'];
  return Promise.allSettled([
    sendEmail(confirmation, failures.email), sendSMS(confirmation, failures.sms),
    writeAuditLog(confirmation, failures.audit)
  ]).then(outcomes => outcomes.map((outcome, index) => ({
    service: services[index], status: outcome.status,
    ...(outcome.status === 'rejected' ? { error: outcome.reason.message } : { value: outcome.value })
  })));
}
export function registerModern(store, studentId, courseCode, failures = {}) {
  const lifecycle = [];
  return Promise.resolve()
    .then(() => prepareContext(store, studentId, courseCode))
    .then(context => getStudent(context))
    .then(context => getCourse(context))
    .then(context => checkPrerequisites(context))
    .then(context => checkSeats(context))
    .then(context => registerStudent(context))
    .then(confirmation => postRegistration(confirmation, failures)
      .then(services => ({ confirmation, services, lifecycle })))
    .catch(error => {
      lifecycle.push(`ERROR: ${error.message}`);
      throw error; // Let the caller observe the failure; do not silently recover.
    })
    .finally(() => { lifecycle.push('Registration attempt finished'); });
}
export function courseServer(course, delay, fail = false) {
  return new Promise((resolve, reject) => {
    setTimeout(() => fail ? reject(new Error('Course server unavailable')) : resolve({ ...course }), delay);
  });
}
export function firstSuccessfulCourse(firstRequest, secondRequest) {
  return Promise.any([firstRequest, secondRequest]);
}
