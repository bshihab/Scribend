import type {Patient} from '../models/Patient';

export const mockPatients: Patient[] = [
  {
    id: 'margaret',
    fullName: 'Margaret Thompson',
    age: 68,
    gender: 'female',
    mrn: 'MT-68125',
    status: 'Active',
    lastVisitDate: 'Apr 28, 2024',
    primaryCondition: 'Hypertension',
    notePreview: 'BP well controlled on current regimen. Advised low-sodium diet and follow-up in 3 months.',
    currentMedications: 'Lisinopril 10mg; Amlodipine 5mg',
    allergies: 'No known drug allergies',
    medications: [
      {name: 'Lisinopril', dosage: '10mg', schedule: 'Daily'},
      {name: 'Amlodipine', dosage: '5mg', schedule: 'Daily'},
    ],
    vitals: [
      {label: 'BP', value: '126/78'},
      {label: 'HR', value: '72', unit: 'bpm'},
      {label: 'SpO₂', value: '98%'},
    ],
    recentNotes: [
      {date: 'Apr 28, 2024', preview: 'BP well controlled on current regimen. Advised low-sodium diet and follow-up in 3 months.'},
    ],
    recentActivity: [
      {date: 'Apr 28, 2024', title: 'Office Visit', description: 'Visit completed with AI scribe'},
      {date: 'Apr 25, 2024', title: 'Vitals Updated', description: 'Home BP log reviewed'},
    ],
  },
  {
    id: 'james',
    fullName: 'James Anderson',
    age: 54,
    gender: 'male',
    mrn: 'JA-55392',
    status: 'Active',
    lastVisitDate: 'May 3, 2024',
    primaryCondition: 'Type 2 Diabetes',
    notePreview: 'A1c improving. Continue Metformin 500mg BID. Recheck in 3 months.',
    currentMedications: 'Metformin 500mg; Atorvastatin 20mg',
    allergies: 'Sulfa sensitivity',
    medications: [
      {name: 'Metformin', dosage: '500mg', schedule: 'Twice daily'},
      {name: 'Atorvastatin', dosage: '20mg', schedule: 'Daily'},
    ],
    vitals: [
      {label: 'BP', value: '128/82'},
      {label: 'HR', value: '76', unit: 'bpm'},
      {label: 'Glucose', value: '142', unit: 'mg/dL'},
    ],
    recentNotes: [
      {date: 'May 3, 2024', preview: 'A1c improving. Continue Metformin 500mg BID. Recheck in 3 months.'},
    ],
    recentActivity: [
      {date: 'May 3, 2024', title: 'Follow-up', description: 'Diabetes care plan updated'},
    ],
  },
  {
    id: 'olivia',
    fullName: 'Olivia Martinez',
    age: 32,
    gender: 'female',
    mrn: 'OM-32104',
    status: 'Active',
    lastVisitDate: 'Apr 15, 2024',
    primaryCondition: 'Asthma',
    notePreview: 'Asthma symptoms stable. Reviewed inhaler technique and trigger avoidance.',
    currentMedications: 'Albuterol inhaler as needed; Fluticasone 110mcg',
    allergies: 'Dust sensitivity',
    medications: [
      {name: 'Albuterol', dosage: '90mcg', schedule: 'As needed'},
      {name: 'Fluticasone', dosage: '110mcg', schedule: 'Twice daily'},
    ],
    vitals: [
      {label: 'BP', value: '118/74'},
      {label: 'HR', value: '70', unit: 'bpm'},
      {label: 'SpO₂', value: '99%'},
    ],
    recentNotes: [
      {date: 'Apr 15, 2024', preview: 'Asthma symptoms stable. Reviewed inhaler technique and trigger avoidance.'},
    ],
    recentActivity: [
      {date: 'Apr 15, 2024', title: 'Office Visit', description: 'Respiratory symptoms assessed'},
    ],
  },
];
