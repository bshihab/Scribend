import {validatePatientForm} from '../src/utils/validators';

describe('patient validation', () => {
  it('rejects invalid patient input', () => {
    expect(validatePatientForm('', '42', 'male')).toBe('Name required');
    expect(validatePatientForm('Test Patient', 'abc', 'female')).toBe('Age must be valid');
    expect(validatePatientForm('Test Patient', '42')).toBe('Gender required');
  });
});
