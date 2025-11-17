// education.js - Utility helpers for education progression and tuition.

export const educationLevels = ['none', 'elementary', 'middle', 'high', 'college', 'graduate'];

export const getSchoolForAge = (age) => {
  if (age >= 18) return null;
  if (age >= 14) return 'high';
  if (age >= 11) return 'middle';
  if (age >= 6) return 'elementary';
  return 'none';
};

export const educationDescriptions = {
  none: 'Too young for school',
  elementary: 'Elementary School',
  middle: 'Middle School',
  high: 'High School',
  college: 'College Student',
  graduate: 'Graduate Program',
};
