import { isRecord } from './gradeUtils.js';
export const studentProfile = {
  id: 101, name: 'Ali', marks: 0, scholarship: false,
  address: { city: 'Islamabad', sector: 'F-10' }, contact: { email: 'ali@university.edu' }
};
export const profileUpdate = {
  name: 'Ali Khan', address: { city: 'Rawalpindi' }, contact: { phone: '03001234567' }
};
export function updateProfile(student, update = {}) {
  if (!isRecord(student) || !isRecord(update)) throw new TypeError('Expected student and update objects');
  const { address = {}, contact = {}, ...otherFields } = student;
  const { address: addressUpdate = {}, contact: contactUpdate = {}, ...changes } = update;
  if (![address, contact, addressUpdate, contactUpdate].every(isRecord)) {
    throw new TypeError('Address and contact must be objects');
  }
  if (Object.hasOwn(changes, 'id') && changes.id !== student.id) throw new Error('Student ID cannot change');
  return { ...otherFields, ...changes, address: { ...address, ...addressUpdate },
    contact: { ...contact, ...contactUpdate } };
}
export function summarizeProfile(student, ...labels) {
  if (!isRecord(student)) throw new TypeError('Expected student object');
  const { name: displayName = 'Unknown', address: { city = 'Unknown' } = {}, ...remaining } = student;
  const [firstLabel = 'student', secondLabel = 'campus'] = labels;
  const marks = student.marks ?? 0;
  const scholarship = student.scholarship ?? false;
  const phone = student.contact?.phone ?? 'Not provided';
  return { displayName, city, marks, scholarship, phone, firstLabel, secondLabel, remaining };
}
export function compareReferences(original, updated) {
  return { sameObject: original === updated, sameAddress: original.address === updated.address,
    sameContact: original.contact === updated.contact };
}
