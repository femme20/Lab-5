import Person from './Person.js';
import Student from './Student.js';
import { isText } from './gradeUtils.js';
export class FacultyMember extends Person {
  constructor(name, email, employeeId, department) {
    super(name, email);
    if (!isText(employeeId) || !isText(department)) throw new TypeError('Employee ID and department are required');
    this.employeeId = employeeId;
    this.department = department;
  }
  introduce() { return `${super.introduce()} I teach in ${this.department}, employee ${this.employeeId}.`; }
}
export function demonstrateUsers() {
  const student = new Student('Ali', 'ali@university.edu', 'CS-101', 82);
  const users = [student, new FacultyMember('Dr. Sana', 'sana@university.edu', 'F01', 'CS'),
    new Student('Sara', 'sara@university.edu', 'CS-102', 91),
    new FacultyMember('Dr. Hina', 'hina@university.edu', 'F02', 'AI')];
  users.forEach(user => console.log(user.introduce()));
  const guest = { name: 'Dr. Ahmed', email: 'ahmed@example.com' };
  const guestIntroduction = Person.prototype.introduce.call(guest);
  const fn = student.introduce;
  let detachedError;
  try { fn(); } catch (error) { detachedError = `${error.name}: ${error.message}`; }
  const bound = student.introduce.bind(student);
  return { guestIntroduction, detachedError, boundIntroduction: bound(), result: student.getResult(),
    studentIsPerson: student instanceof Person, studentIsStudent: student instanceof Student,
    facultyIsStudent: users[1] instanceof Student };
}
