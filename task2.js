import { calculateGrade, calculateAverage, isRecord, isText } from './gradeUtils.js';
export const results = [
  { id: 1, name: 'Ali', department: 'CS', course: 'FSWD', marks: 82 },
  { id: 2, name: 'Sara', department: 'CS', course: 'FSWD', marks: 91 },
  { id: 3, name: 'Usman', department: 'SE', course: 'FSWD', marks: 47 },
  { id: 4, name: 'Hina', department: 'AI', course: 'FSWD', marks: 73 },
  { id: 5, name: 'Ahmed', department: 'SE', course: 'FSWD', marks: 64 },
  { id: 6, name: 'Zoya', department: 'AI', course: 'FSWD', marks: 91 }
];
export function validResult(row) {
  return isRecord(row) && Number.isInteger(row.id) && row.id > 0 &&
    isText(row.name) && isText(row.department) && isText(row.course) &&
    typeof row.marks === 'number' && Number.isFinite(row.marks) && row.marks >= 0 && row.marks <= 100;
}
export function analyzeResults(source) {
  if (!Array.isArray(source)) throw new TypeError('Results must be an array');
  const rejected = source.filter(row => !validResult(row));
  const valid = source.filter(validResult);
  const processed = valid.map(row => ({ ...row, ...calculateGrade(row.marks) }));
  const ranked = [...processed].sort((a, b) => b.marks - a.marks || a.name.localeCompare(b.name));
  const departments = Object.create(null); // Safe even for unusual department names.
  processed.forEach(row => {
    const stats = departments[row.department] ?? { students: 0, total: 0, highest: null, passed: 0 };
    stats.students += 1;
    stats.total += row.marks;
    stats.highest = stats.highest === null ? row.marks : Math.max(stats.highest, row.marks);
    stats.passed += row.status === 'PASS' ? 1 : 0;
    departments[row.department] = stats;
  });
  Object.keys(departments).forEach(key => {
    const { total, ...stats } = departments[key];
    departments[key] = { ...stats, average: total / stats.students };
  });
  const average = calculateAverage(valid.map(row => row.marks));
  return { processed, ranked, departments, average, rejected, queries: {
    firstAbove85: processed.find(row => row.marks > 85) ?? null,
    // Original source index, so skipping bad rows does not shift the answer.
    firstFailedIndex: source.findIndex(row => validResult(row) && row.marks < 50),
    anyFailed: processed.some(row => row.status === 'FAIL'),
    everyMarkValid: source.every(row => isRecord(row) && typeof row.marks === 'number' &&
      Number.isFinite(row.marks) && row.marks >= 0 && row.marks <= 100),
    aboveAverage: processed.filter(row => row.marks > average),
    topThreeNames: ranked.slice(0, 3).map(row => row.name)
  } };
}
