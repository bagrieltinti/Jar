// illnesses.js - Registry of illnesses with recovery and severity parameters.

const illnesses = [
  {
    id: 'flu',
    name: 'Flu',
    minAge: 4,
    maxAge: 80,
    severity: 1,
    healthDrainPerYear: 5,
    chanceToRecover: 0.5,
    chanceOfDeath: 0.01,
  },
  {
    id: 'cold',
    name: 'Severe Cold',
    minAge: 2,
    maxAge: 70,
    severity: 1,
    healthDrainPerYear: 3,
    chanceToRecover: 0.6,
    chanceOfDeath: 0.005,
  },
  {
    id: 'injury',
    name: 'Minor Injury',
    minAge: 6,
    maxAge: 90,
    severity: 2,
    healthDrainPerYear: 7,
    chanceToRecover: 0.35,
    chanceOfDeath: 0.02,
  },
  {
    id: 'heart_issue',
    name: 'Heart Complication',
    minAge: 45,
    maxAge: 95,
    severity: 3,
    healthDrainPerYear: 12,
    chanceToRecover: 0.2,
    chanceOfDeath: 0.08,
  },
];

export default illnesses;
