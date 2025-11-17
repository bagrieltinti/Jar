// gameState.js - Core simulation logic, yearly updates, and data orchestration.
// README (adding data):
//  - To add events, extend src/data/events.js with objects {id, tags, minAge, weight, condition, apply}.
//  - To add jobs, extend src/data/jobs.js with requirements; the Career tab automatically lists them.
//  - To add assets, extend src/data/assets.js arrays. They will appear in the Finance tab for purchase.

import { Player } from '../models/player.js';
import { NPC } from '../models/npc.js';
import { Relationship } from '../models/relationship.js';
import { runYearlyEvents } from './eventEngine.js';
import assetsData from '../data/assets.js';
import jobs from '../data/jobs.js';
import colleges from '../data/colleges.js';
import { applyYearlyHealthDrift, tickIllnesses } from '../models/health.js';
import { getSchoolForAge } from '../models/education.js';
import { chance, pickOne, rand } from './random.js';

const firstNames = ['Alex', 'Bailey', 'Casey', 'Drew', 'Emery', 'Harper', 'Jordan', 'Kai', 'Logan', 'Mika', 'Nova'];
const lastNames = ['Rivera', 'Nguyen', 'Lee', 'Patel', 'Lopez', 'Bennett', 'Diaz', 'Johnson'];
const locations = ['Seattle, USA', 'Toronto, Canada', 'Lisbon, Portugal', 'Oslo, Norway'];

export const defaultState = () => ({
  player: Player.create(generateBasePlayer()),
  npcs: generateFamily(),
  lastSummary: [],
  lastIncome: 0,
  lastExpenses: 0,
  yearActions: 0,
});

export const loadStateFromData = (data) => {
  const player = new Player(data.player);
  return { ...data, player };
};

const generateBasePlayer = () => ({
  name: `${pickOne(firstNames)} ${pickOne(lastNames)}`,
  gender: pickOne(['male', 'female', 'non-binary']),
  money: rand(200, 1200),
  health: rand(70, 90),
  happiness: rand(60, 80),
  smarts: rand(50, 90),
  looks: rand(40, 80),
  comedy: rand(40, 80),
  location: pickOne(locations),
});

const generateFamily = () => {
  const mother = new NPC({ id: 'mother', name: pickOne(firstNames) + ' ' + pickOne(lastNames), age: rand(25, 45), relationshipType: 'mother' });
  const father = new NPC({ id: 'father', name: pickOne(firstNames) + ' ' + pickOne(lastNames), age: rand(25, 45), relationshipType: 'father' });
  const sibling = new NPC({ id: 'sibling', name: pickOne(firstNames) + ' ' + pickOne(lastNames), age: rand(1, 15), relationshipType: 'sibling' });
  return [mother, father, sibling];
};

export const initializeRelationships = (state) => {
  state.player.relationships = state.npcs.map((npc) => new Relationship({ npcId: npc.id, closeness: 60, respect: 60, romantic: 0, conflict: 20, relationshipType: npc.relationshipType }));
};

export const advanceYear = (state) => {
  const player = state.player;
  if (!player.alive) return { summary: ['You have passed away. Start a new life.'] };

  state.yearActions = 0;
  player.age += 1;
  player.addLog(`I turned ${player.age}.`, ['age']);

  const summary = [];
  updateEducation(player, summary);
  const income = handleCareer(player, summary);
  const expenses = handleExpenses(player, summary);
  applyYearlyHealthDrift(player);
  tickIllnesses(player);
  degradeRelationships(player, state.npcs);
  runYearlyEvents(player, state);
  player.checkDeath();

  state.lastIncome = income;
  state.lastExpenses = expenses;
  state.lastSummary = summary;

  return { summary };
};

const updateEducation = (player, summary) => {
  const schoolLevel = getSchoolForAge(player.age);
  if (schoolLevel && player.education.currentLevel !== schoolLevel) {
    player.education.currentLevel = schoolLevel;
    player.education.yearsInCurrentLevel = 0;
    player.addLog(`I started ${schoolLevel} school.`, ['education']);
  }
  if (schoolLevel) {
    player.education.yearsInCurrentLevel += 1;
    const change = rand(-5, 6);
    player.education.grades = Math.max(0, Math.min(100, player.education.grades + change));
    summary.push(`School life: grades now ${player.education.grades}.`);
  }

  if (player.education.currentCollege) {
    player.education.progress += 1;
    if (player.education.progress >= 4) {
      player.education.currentLevel = 'college';
      player.education.currentCollege = null;
      player.education.progress = 0;
      player.addLog('I graduated from college!', ['education']);
    }
  }
};

const handleCareer = (player, summary) => {
  if (!player.career.currentJobId) {
    player.career.unemployedYears += 1;
    summary.push('Still looking for a job.');
    return 0;
  }
  const salary = player.career.salaryPerYear;
  const taxes = Math.round(salary * 0.2);
  player.modifyMoney(salary - taxes);
  player.modifyStat('happiness', 1);
  summary.push(`Earned ${salary - taxes} after taxes.`);
  if (chance(0.1 + player.career.performance / 200)) {
    player.career.performance = Math.min(100, player.career.performance + 5);
  }
  if (chance(0.05)) {
    player.career.performance = Math.max(20, player.career.performance - 10);
    summary.push('Work stress impacted performance.');
  }
  if (player.career.performance < 25 && chance(0.2)) {
    summary.push('Got fired due to low performance.');
    player.career = { currentJobId: null, jobTitle: 'Unemployed', salaryPerYear: 0, performance: 50, unemployedYears: 0 };
  }
  return salary - taxes;
};

const handleExpenses = (player, summary) => {
  let expenses = 0;
  player.assets.forEach((asset) => {
    if (asset.yearlyCost) {
      expenses += asset.yearlyCost;
      player.modifyMoney(-asset.yearlyCost);
    }
    if (asset.happinessBonus) player.modifyStat('happiness', asset.happinessBonus);
  });

  if (player.education.currentCollege) {
    const college = colleges.find((c) => c.id === player.education.currentCollege);
    if (college) {
      expenses += college.cost;
      player.modifyMoney(-college.cost);
      player.addLog(`Paid ${college.name} tuition.`, ['finance']);
    }
  }
  summary.push(`Expenses this year: ${expenses}.`);
  return expenses;
};

const degradeRelationships = (player, npcs) => {
  player.relationships.forEach((rel) => {
    rel.closeness = Math.max(0, rel.closeness - 2);
    const npc = npcs.find((n) => n.id === rel.npcId);
    if (npc) npc.mood = Math.max(0, npc.mood - 1);
  });
};

export const performActivity = (state, action) => {
  const player = state.player;
  state.yearActions += 1;
  switch (action) {
    case 'babble':
      player.modifyStat('happiness', 2);
      player.addLog('I babbled happily at everyone.', ['activity']);
      break;
    case 'play':
      player.modifyStat('happiness', 4);
      player.modifyStat('smarts', 1);
      player.addLog('Played with toys and learned about gravity (again).', ['activity']);
      break;
    case 'study':
      player.education.grades = Math.min(100, player.education.grades + 5);
      player.addLog('Hit the books extra hard.', ['activity']);
      break;
    case 'friends':
      player.modifyStat('happiness', 5);
      player.addLog('Hung out with friends and swapped memes.', ['activity']);
      break;
    case 'parttime':
      player.modifyMoney(500);
      player.modifyStat('happiness', -1);
      player.addLog('Worked a part-time gig for some cash.', ['activity']);
      break;
    case 'exercise':
      player.modifyStat('health', 4);
      player.modifyStat('happiness', 1);
      player.addLog('Hit the gym and felt energized.', ['health']);
      break;
    case 'nightout':
      player.modifyMoney(-150);
      player.modifyStat('happiness', 4);
      player.addLog('Went out for a fun night.', ['activity']);
      break;
    case 'travel':
      if (player.money >= 400) {
        player.modifyMoney(-400);
        player.modifyStat('happiness', 6);
        player.addLog('Took a short trip and saw something new.', ['activity']);
      } else {
        player.addLog('Wanted to travel but could not afford it.', ['finance']);
      }
      break;
    case 'family':
      player.modifyStat('happiness', 3);
      player.addLog('Hosted a cozy family dinner.', ['activity']);
      break;
    case 'hobby':
      player.modifyStat('happiness', 2);
      player.modifyStat('comedy', 2);
      player.addLog('Spent time on a favorite hobby.', ['activity']);
      break;
    case 'volunteer':
      player.modifyStat('happiness', 4);
      player.addLog('Volunteered at a local shelter.', ['activity']);
      break;
    case 'relax':
      player.modifyStat('health', 2);
      player.addLog('Relaxed and took deep breaths.', ['activity']);
      break;
    case 'stories':
      player.modifyStat('comedy', 3);
      player.addLog('Shared stories with young folks.', ['activity']);
      break;
    case 'stroll':
      player.modifyStat('health', 2);
      player.addLog('Enjoyed a park stroll.', ['activity']);
      break;
    default:
      break;
  }
};

export const buyAsset = (state, assetDef) => {
  const player = state.player;
  if (player.money < assetDef.price) {
    player.addLog(`I cannot afford ${assetDef.name}.`, ['finance']);
    return false;
  }
  player.modifyMoney(-assetDef.price);
  player.addAsset({ ...assetDef });
  player.addLog(`Purchased ${assetDef.name}.`, ['finance']);
  return true;
};

export const applyForJob = (state, job) => {
  const player = state.player;
  if (player.career.currentJobId) {
    player.addLog('I already have a job.', ['career']);
    return false;
  }
  const eduLevels = ['none', 'elementary', 'middle', 'high', 'college', 'graduate'];
  const meetsEducation = eduLevels.indexOf(player.education.currentLevel) >= eduLevels.indexOf(job.minEducation);
  if (!meetsEducation || player.smarts < job.minSmarts) {
    player.addLog(`I was rejected from ${job.title}.`, ['career']);
    return false;
  }
  player.career = {
    currentJobId: job.id,
    jobTitle: job.title,
    salaryPerYear: job.startingSalary,
    performance: 55,
    unemployedYears: 0,
  };
  player.addLog(`I landed a job as ${job.title}!`, ['career']);
  return true;
};

export const jobWorkHarder = (state) => {
  const player = state.player;
  if (!player.career.currentJobId) return;
  player.career.performance = Math.min(100, player.career.performance + 8);
  player.modifyStat('happiness', -1);
  player.addLog('I worked extra hard this year.', ['career']);
};

export const jobSlackOff = (state) => {
  const player = state.player;
  if (!player.career.currentJobId) return;
  player.career.performance = Math.max(0, player.career.performance - 8);
  player.addLog('I slacked off at work. Hopefully no one noticed.', ['career']);
};

export const applyToCollege = (state, college) => {
  const player = state.player;
  if (player.education.currentCollege === college.id) return;
  if (player.education.grades < college.minGrades || player.smarts < college.minSmarts) {
    player.addLog(`I was not accepted to ${college.name}.`, ['education']);
    return false;
  }
  if (player.money < college.cost) {
    player.addLog(`I cannot afford to enroll in ${college.name}.`, ['education']);
    return false;
  }
  player.education.currentCollege = college.id;
  player.education.progress = 0;
  player.education.currentLevel = 'college';
  player.modifyMoney(-college.cost);
  player.addLog(`Enrolled in ${college.name}!`, ['education']);
  return true;
};

export const relationshipAction = (state, relationship, npc, action) => {
  const outcomes = {
    spend: () => {
      relationship.closeness = Math.min(100, relationship.closeness + rand(4, 8));
      state.player.modifyStat('happiness', 2);
      state.player.addLog(`Spent time with ${npc.name}.`, ['relationships']);
    },
    compliment: () => {
      const success = chance(0.7);
      if (success) {
        relationship.closeness = Math.min(100, relationship.closeness + 6);
        relationship.respect = Math.min(100, relationship.respect + 4);
        state.player.addLog(`${npc.name} loved my compliment!`, ['relationships']);
      } else {
        relationship.conflict = Math.min(100, relationship.conflict + 4);
        state.player.addLog(`${npc.name} rolled their eyes at me.`, ['relationships']);
      }
    },
    argue: () => {
      relationship.conflict = Math.min(100, relationship.conflict + rand(5, 10));
      state.player.modifyStat('happiness', -4);
      state.player.addLog(`Argued with ${npc.name}.`, ['relationships']);
    },
    apologize: () => {
      const success = chance(0.6);
      if (success) {
        relationship.conflict = Math.max(0, relationship.conflict - 6);
        relationship.closeness = Math.min(100, relationship.closeness + 3);
        state.player.addLog(`${npc.name} accepted my apology.`, ['relationships']);
      } else {
        state.player.addLog(`${npc.name} was not ready to forgive me.`, ['relationships']);
      }
    },
  };

  const handler = outcomes[action];
  if (handler) handler();
};

export const doctorVisit = (state) => {
  const player = state.player;
  if (player.money < 500) {
    player.addLog('I could not afford to see the doctor.', ['health']);
    return;
  }
  player.modifyMoney(-500);
  if (player.illnesses.length && chance(0.7)) {
    const illness = player.illnesses[0];
    player.removeIllness(illness);
    player.addLog('Doctor visit cured my illness.', ['health']);
  } else {
    player.modifyStat('health', 5);
    player.addLog('Doctor gave me a clean bill of health.', ['health']);
  }
};

export const exercise = (state) => {
  state.player.modifyStat('health', 4);
  state.player.addLog('I exercised and felt better.', ['health']);
};

export const rest = (state) => {
  state.player.modifyStat('health', 3);
  state.player.addLog('Took it easy to recover energy.', ['health']);
};

export const getAssetsData = () => assetsData;
export const getJobs = () => jobs;
export const getColleges = () => colleges;
