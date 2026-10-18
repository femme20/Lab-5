import { isRecord, isText } from './gradeUtils.js';

export const applicants = [
  { id: 'A101', name: 'Sara Khan', age: '19', matricMarks: '91',
    intermediateMarks: '87', entryTest: '78', program: 'BSCS', feePaid: 'true' },
  { id: 'A102', name: 'Ahmed Ali', age: 'twenty', matricMarks: '88',
    intermediateMarks: '', entryTest: '72', program: 'BSSE', feePaid: 'false' },
  { id: 'A103', name: 'Hassan', age: '18', matricMarks: '76',
    intermediateMarks: '83', entryTest: '91', program: 'BSAI', feePaid: 'true' }
];

function supportedProgram(program) {
  switch (program) {
    case 'BSCS': case 'BSSE': case 'BSAI': return true;
    default: return false;
  }
}
function numericValue(value, field, errors) {
  if (value === null || value === undefined ||
      (typeof value === 'string' && value.trim() === '')) {
    errors.push(`${field} is missing`);
    return null;
  }
  if (typeof value !== 'number' && typeof value !== 'string') {
    errors.push(`${field} must be numeric`);
    return null;
  }
  const number = Number(value); // Explicit conversion; Number('') would incorrectly give 0.
  if (!Number.isFinite(number)) {
    errors.push(`${field} is not a finite number`);
    return null;
  }
  return number;
}
export function processApplicant(input) {
  if (!isRecord(input)) return { status: 'INVALID DATA', merit: null, errors: ['Expected an object'] };
  const errors = [];
  const id = isText(input.id) ? input.id.trim() : '';
  const name = isText(input.name) ? input.name.trim() : '';
  const program = isText(input.program) ? input.program.trim().toUpperCase() : '';
  if (!id) errors.push('ID is required');
  if (!name) errors.push('Name is required');
  if (!supportedProgram(program)) errors.push('Unsupported program');
  const age = numericValue(input.age, 'age', errors);
  const matricMarks = numericValue(input.matricMarks, 'matricMarks', errors);
  const intermediateMarks = numericValue(input.intermediateMarks, 'intermediateMarks', errors);
  const entryTest = numericValue(input.entryTest, 'entryTest', errors);
  if (age !== null && (!Number.isInteger(age) || age < 17 || age > 30)) {
    errors.push('Age must be a whole number between 17 and 30');
  }
  for (const [field, marks] of Object.entries({ matricMarks, intermediateMarks, entryTest })) {
    if (marks !== null && (marks < 0 || marks > 100)) errors.push(`${field} must be 0 to 100`);
  }
  let feePaid = null;
  if (input.feePaid === true || input.feePaid === 'true') feePaid = true;
  else if (input.feePaid === false || input.feePaid === 'false') feePaid = false;
  else errors.push('feePaid must be true or false');
  // Boolean('false') is true, so it is deliberately not used here.
  const cleaned = { id, name, program, age, matricMarks, intermediateMarks, entryTest, feePaid };
  if (errors.length > 0) return { ...cleaned, status: 'INVALID DATA', merit: null, errors };
  const merit = matricMarks * 0.2 + intermediateMarks * 0.3 + entryTest * 0.5;
  const eligible = merit >= 70 && entryTest >= 60 && intermediateMarks >= 60;
  // Assumption: eligible + paid = selected; eligible + unpaid = waiting.
  const status = eligible ? (feePaid ? 'SELECTED' : 'WAITING') : 'REJECTED';
  return { ...cleaned, merit, eligible, status, errors };
}
export function processAdmissions(source) {
  if (!Array.isArray(source)) throw new TypeError('Applicants must be an array');
  const processed = source.map(processApplicant);
  const valid = processed.filter(a => a.status !== 'INVALID DATA');
  let highestMeritApplicant = null;
  let lowestMerit = null;
  let total = 0;
  const programCounts = { BSCS: 0, BSSE: 0, BSAI: 0 };
  for (const a of processed) {
    // Counts include invalid applications when their program is supported.
    if (supportedProgram(a.program)) programCounts[a.program] += 1;
  }
  for (const a of valid) {
    total += a.merit;
    if (highestMeritApplicant === null || a.merit > highestMeritApplicant.merit) highestMeritApplicant = a;
    if (lowestMerit === null || a.merit < lowestMerit) lowestMerit = a.merit;
  }
  return { processed, summary: {
    validApplicants: valid.length, invalidApplicants: processed.length - valid.length,
    highestMeritApplicant, lowestMerit,
    averageMerit: valid.length === 0 ? null : total / valid.length, programCounts
  } };
}
