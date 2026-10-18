import { isText } from './gradeUtils.js';
export default class Person {
  constructor(name, email) {
    if (!isText(name) || !isText(email)) throw new TypeError('Name and email are required');
    this.name = name;
    this.email = email;
  }
  introduce() { return `I am ${this.name}. My email is ${this.email}.`; }
}
