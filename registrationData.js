// Every demo receives fresh state. Registration explicitly updates this simulated store.
export function createStore() {
  return {
    students: [
      { id: 101, name: 'Ali', completed: ['CS301'], registered: [] },
      { id: 102, name: 'Sara', completed: [], registered: [] },
      { id: 103, name: 'Hina', completed: ['CS301'], registered: ['CS401'] }
    ],
    courses: [
      { code: 'CS401', prerequisite: 'CS301', seats: 2 },
      { code: 'CS402', prerequisite: 'CS301', seats: 0 }
    ]
  };
}
export function prepareContext(store, studentId, courseCode) {
  if (!store || !Array.isArray(store.students) || !Array.isArray(store.courses)) {
    throw new TypeError('Invalid registration store');
  }
  if (!Number.isInteger(studentId) || typeof courseCode !== 'string' || !courseCode.trim()) {
    throw new TypeError('Valid student ID and course code are required');
  }
  return { store, studentId, courseCode };
}
export function loadStudentData(context) {
  const student = context.store.students.find(s => s.id === context.studentId);
  if (!student) throw new Error('Student does not exist');
  return { ...context, student };
}
export function loadCourseData(context) {
  const course = context.store.courses.find(c => c.code === context.courseCode);
  if (!course) throw new Error('Course does not exist');
  return { ...context, course };
}
export function verifyPrerequisites(context) {
  if (context.course.prerequisite && !context.student.completed.includes(context.course.prerequisite)) {
    throw new Error('Prerequisite not completed');
  }
  return context;
}
export function verifySeats(context) {
  if (context.course.seats <= 0) throw new Error('Course is full');
  return context;
}
export function commitRegistration(context) {
  if (context.student.registered.includes(context.courseCode)) throw new Error('Student already registered');
  // Recheck at commit time to prevent two requests taking the final seat.
  verifySeats(context);
  context.student.registered.push(context.courseCode);
  context.course.seats -= 1;
  return { studentId: context.studentId, course: context.courseCode, status: 'REGISTERED' };
}
