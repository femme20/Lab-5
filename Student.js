import Person from './Person.js';
import { calculateGrade, validateMarks, isText } from './gradeUtils.js';
export default class Student extends Person {
  constructor(name, email, rollNo, marks) {
    super(name, email);
    if (!isText(rollNo)) throw new TypeError('Roll number is required');
    validateMarks(marks);
    this.rollNo = rollNo;
    this.marks = marks;
  }
  introduce() { return `${super.introduce()} I am a student, roll number ${this.rollNo}.`; }
  getResult() { return { rollNo: this.rollNo, marks: this.marks, ...calculateGrade(this.marks) }; }
}
