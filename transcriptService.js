import Student from './Student.js';
import { calculateAverage, calculateGPA as getGPA, isRecord, isText } from './gradeUtils.js';
export function processTranscript(rawData) {
  if (typeof rawData !== 'string') throw new TypeError('Transcript must be a JSON string');
  let parsed;
  try { parsed = JSON.parse(rawData); }
  catch { throw new SyntaxError('Malformed transcript JSON'); }
  if (!Array.isArray(parsed)) throw new TypeError('Transcript root must be an array');
  const seenIds = new Set();
  const students = parsed.map(row => {
    if (!isRecord(row)) throw new TypeError('Each student must be an object');
    if (!Number.isInteger(row.id) || row.id <= 0) throw new TypeError('Student ID must be a positive integer');
    if (seenIds.has(row.id)) throw new Error(`Duplicate student ID: ${row.id}`);
    seenIds.add(row.id);
    if (!isText(row.name)) throw new TypeError('Student name is required');
    if (!Array.isArray(row.courses)) throw new TypeError('Courses must be an array');
    const courses = row.courses.map(course => {
      if (!isRecord(course) || !isText(course.code)) throw new TypeError('Course code is required');
      // Reuse the default-exported class from Task 4, rather than duplicate it.
      const student = new Student(row.name, `${row.id}@university.edu`, String(row.id), course.marks);
      return { code: course.code.trim(), ...student.getResult() };
    });
    const marks = courses.map(course => course.marks);
    return { id: row.id, name: row.name, courses, average: calculateAverage(marks), gpa: getGPA(marks) };
  });
  const report = { studentCount: students.length, students };
  return { report, json: JSON.stringify(report, null, 2) };
}
export const rawData = JSON.stringify([
  { id: 101, name: 'Ali', courses: [{ code: 'CS301', marks: 81 }, { code: 'CS302', marks: 74 }] }
]);
