// player.js - Player model describing stats, helpers, and persistence serialization.

import { clamp } from '../utils/math.js';

export class Player {
  constructor(data) {
    Object.assign(this, data);
  }

  static create(base) {
    return new Player({
      name: base.name,
      gender: base.gender,
      age: 0,
      money: base.money ?? 0,
      health: base.health ?? 80,
      happiness: base.happiness ?? 70,
      smarts: base.smarts ?? 60,
      looks: base.looks ?? 60,
      comedy: base.comedy ?? 55,
      alive: true,
      location: base.location ?? 'Unknown',
      education: base.education ?? {
        currentLevel: 'none',
        yearsInCurrentLevel: 0,
        grades: 65,
        currentCollege: null,
        progress: 0,
      },
      career: base.career ?? {
        currentJobId: null,
        jobTitle: 'Unemployed',
        salaryPerYear: 0,
        performance: 50,
        unemployedYears: 0,
      },
      relationships: base.relationships ?? [],
      illnesses: base.illnesses ?? [],
      assets: base.assets ?? [],
      historyLog: base.historyLog ?? [],
    });
  }

  toJSON() {
    return { ...this };
  }

  modifyStat(key, amount) {
    if (!(key in this)) return;
    const clamped = clamp((this[key] ?? 0) + amount, 0, 100);
    this[key] = clamped;
    return clamped;
  }

  modifyMoney(amount) {
    this.money = Math.max(0, Math.round((this.money + amount) * 100) / 100);
    return this.money;
  }

  addLog(text, tags = []) {
    this.historyLog.unshift({ text, age: this.age, tags, timestamp: Date.now() });
  }

  addIllness(illnessId) {
    if (!this.illnesses.includes(illnessId)) this.illnesses.push(illnessId);
  }

  removeIllness(illnessId) {
    this.illnesses = this.illnesses.filter((i) => i !== illnessId);
  }

  hasIllness(id) {
    return this.illnesses.includes(id);
  }

  addAsset(asset) {
    this.assets.push(asset);
  }

  removeAsset(id) {
    this.assets = this.assets.filter((a) => a.id !== id);
  }

  getLifeStage() {
    if (this.age <= 3) return 'toddler';
    if (this.age <= 12) return 'child';
    if (this.age <= 17) return 'teen';
    if (this.age <= 25) return 'youngAdult';
    if (this.age <= 60) return 'adult';
    return 'elder';
  }

  checkDeath() {
    if (this.health <= 0) {
      this.alive = false;
      this.addLog('I passed away due to failing health.', ['death']);
    }
    if (this.age >= 95 && Math.random() < 0.35) {
      this.alive = false;
      this.addLog('My life quietly came to an end of old age.', ['death']);
    }
    return !this.alive;
  }
}
