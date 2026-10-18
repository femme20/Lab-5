// Shared policy: grade points are an assumption because the sheet omits them.
export function validateMarks(marks) {
  if (typeof marks !== 'number' || !Number.isFinite(marks)) {
    throw new TypeError('Marks must be a finite number');
  }
  if (marks < 0 || marks > 100) throw new RangeError('Marks must be 0 to 100');
  return marks;
}

export function calculateGrade(marks) {
  validateMarks(marks);
  // Lower-bound comparisons also support decimal marks without gaps.
  if (marks >= 85) return { grade: 'A', gradePoints: 4.0, status: 'PASS' };
  if (marks >= 80) return { grade: 'A-', gradePoints: 3.67, status: 'PASS' };
  if (marks >= 75) return { grade: 'B+', gradePoints: 3.33, status: 'PASS' };
  if (marks >= 70) return { grade: 'B', gradePoints: 3.0, status: 'PASS' };
  if (marks >= 65) return { grade: 'B-', gradePoints: 2.67, status: 'PASS' };
  if (marks >= 60) return { grade: 'C+', gradePoints: 2.33, status: 'PASS' };
  if (marks >= 50) return { grade: 'C', gradePoints: 2.0, status: 'PASS' };
  return { grade: 'F', gradePoints: 0, status: 'FAIL' };
}

export function calculateAverage(marks) {
  if (!Array.isArray(marks)) throw new TypeError('Expected an array of marks');
  marks.forEach(validateMarks);
  return marks.length === 0 ? null : marks.reduce((sum, m) => sum + m, 0) / marks.length;
}

export function calculateGPA(marks) {
  if (!Array.isArray(marks)) throw new TypeError('Expected an array of marks');
  // Equal course weights: credit hours were not supplied.
  return marks.length === 0 ? null : marks.reduce(
    (sum, m) => sum + calculateGrade(m).gradePoints, 0
  ) / marks.length;
}

export function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
export function isText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
