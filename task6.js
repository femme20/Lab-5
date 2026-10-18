import { prepareContext, loadStudentData, loadCourseData, verifyPrerequisites,
  verifySeats, commitRegistration } from './registrationData.js';

// No Promises or async/await in this module. Errors are caught inside each timer.
// The callback is OUTSIDE try/catch so an exception in caller code cannot cause
// the service to invoke the same callback a second time.
export function loadStudent(context, callback) {
  setTimeout(() => {
    let value;
    try { value = loadStudentData(context); }
    catch (error) { callback(error, null); return; }
    callback(null, value);
  }, 5);
}
export function checkPrerequisites(context, callback) {
  setTimeout(() => {
    let value;
    try { value = verifyPrerequisites(loadCourseData(context)); }
    catch (error) { callback(error, null); return; }
    callback(null, value);
  }, 5);
}
export function checkAvailableSeats(context, callback) {
  setTimeout(() => {
    let value;
    try { value = verifySeats(context); }
    catch (error) { callback(error, null); return; }
    callback(null, value);
  }, 5);
}
export function registerCourse(context, callback) {
  setTimeout(() => {
    let value;
    try { value = commitRegistration(context); }
    catch (error) { callback(error, null); return; }
    callback(null, value);
  }, 5);
}
export function registerLegacy(store, studentId, courseCode, callback) {
  if (typeof callback !== 'function') throw new TypeError('A callback is required');
  let context;
  try { context = prepareContext(store, studentId, courseCode); }
  catch (error) { setTimeout(callback, 0, error, null); return; }
  loadStudent(context, (studentError, studentData) => {
    if (studentError) { callback(studentError, null); return; }
    checkPrerequisites(studentData, (prerequisiteError, prerequisiteData) => {
      if (prerequisiteError) { callback(prerequisiteError, null); return; }
      checkAvailableSeats(prerequisiteData, (seatError, seatData) => {
        if (seatError) { callback(seatError, null); return; }
        registerCourse(seatData, (registrationError, confirmation) => {
          if (registrationError) { callback(registrationError, null); return; }
          callback(null, confirmation);
        });
      });
    });
  });
}
