import {mockPatients} from '../src/data/mockPatients';
import {filterPatientsByGender, searchPatients} from '../src/utils/patientFilters';

describe('patient filters', () => {
  it('filters patients by gender', () => {
    const malePatients = filterPatientsByGender(mockPatients, 'male');
    expect(malePatients).toHaveLength(1);
    expect(malePatients.every(patient => patient.gender === 'male')).toBe(true);
  });

  it('searches patients by name', () => {
    const results = searchPatients(mockPatients, 'Margaret');
    expect(results).toHaveLength(1);
    expect(results[0].fullName).toBe('Margaret Thompson');
  });
});
