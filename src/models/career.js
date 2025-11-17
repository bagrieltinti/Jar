// career.js - Helper utilities for applying job logic and promotions.

export class Career {
  constructor({ currentJobId = null, jobTitle = 'Unemployed', salaryPerYear = 0, performance = 50, unemployedYears = 0 }) {
    this.currentJobId = currentJobId;
    this.jobTitle = jobTitle;
    this.salaryPerYear = salaryPerYear;
    this.performance = performance;
    this.unemployedYears = unemployedYears;
  }
}

export const performanceDelta = (current, change) => Math.max(0, Math.min(100, current + change));
