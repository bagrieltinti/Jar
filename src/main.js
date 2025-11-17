/*
Main entry point for the browser-based life simulator.
How to extend data:
  • Events: append new objects to src/data/events.js with custom conditions and apply logic.
  • Jobs: add entries to src/data/jobs.js to automatically expose them in the Career tab.
  • Assets: add houses/cars/collectibles in src/data/assets.js for instant availability in Finance.
*/

import {
  defaultState,
  loadStateFromData,
  initializeRelationships,
  advanceYear,
  performActivity,
  buyAsset,
  applyForJob,
  jobWorkHarder,
  jobSlackOff,
  applyToCollege,
  relationshipAction,
  doctorVisit,
  exercise as exerciseAction,
  rest as restAction,
  getAssetsData,
  getJobs,
  getColleges,
} from './core/gameState.js';
import { saveState, loadState } from './persistence/storage.js';
import { createUIController } from './ui/uiController.js';

let state;
let ui;
const assetsData = getAssetsData();
const jobs = getJobs();
const colleges = getColleges();

const init = () => {
  const saved = loadState();
  if (saved) {
    state = loadStateFromData(saved);
  } else {
    state = defaultState();
    initializeRelationships(state);
    state.player.addLog('I was born today. Welcome to the world!', ['birth']);
  }

  ui = createUIController({
    state,
    assetsData,
    jobs,
    colleges,
    callbacks: createCallbacks(),
  });

  document.getElementById('ageButton').addEventListener('click', onAgeUp);
  document.getElementById('modalClose').addEventListener('click', () => {
    hideModal();
    if (!state.player.alive) {
      startNewLife();
    }
  });

  ui.refresh();
  saveState(state);
};

const onAgeUp = () => {
  const result = advanceYear(state);
  saveState(state);
  ui.refresh();
  if (!state.player.alive) {
    showDeathSummary();
  } else if (result?.summary?.length) {
    showSummary(result.summary);
  }
};

const createCallbacks = () => ({
  performActivity: (action) => {
    performActivity(state, action);
    saveState(state);
    ui.refresh();
  },
  buyAsset: (asset) => {
    buyAsset(state, asset);
    saveState(state);
    ui.refresh();
  },
  relationshipAction: (rel, npc, action) => {
    relationshipAction(state, rel, npc, action);
    saveState(state);
    ui.refresh();
  },
  applyForJob: (job) => {
    applyForJob(state, job);
    saveState(state);
    ui.refresh();
  },
  workHarder: () => {
    jobWorkHarder(state);
    saveState(state);
    ui.refresh();
  },
  slackOff: () => {
    jobSlackOff(state);
    saveState(state);
    ui.refresh();
  },
  applyToCollege: (college) => {
    applyToCollege(state, college);
    saveState(state);
    ui.refresh();
  },
  doctorVisit: () => {
    doctorVisit(state);
    saveState(state);
    ui.refresh();
  },
  exercise: () => {
    exerciseAction(state);
    saveState(state);
    ui.refresh();
  },
  rest: () => {
    restAction(state);
    saveState(state);
    ui.refresh();
  },
});

const showSummary = (summary) => {
  const modal = document.getElementById('modal');
  document.getElementById('modalTitle').textContent = 'Year in Review';
  document.getElementById('modalBody').innerHTML = summary.map((line) => `<p>${line}</p>`).join('');
  modal.classList.remove('hidden');
};

const showDeathSummary = () => {
  const modal = document.getElementById('modal');
  const player = state.player;
  const details = [
    `You passed away at age ${player.age}.`,
    `Highest career: ${player.career.jobTitle}.`,
    `Net worth: $${player.money.toLocaleString()}.`,
    `Relationships maintained: ${player.relationships.length}.`,
    `Illnesses survived: ${player.historyLog.filter((log) => log.tags?.includes('health')).length}.`,
  ];
  document.getElementById('modalTitle').textContent = 'Life Recap';
  document.getElementById('modalBody').innerHTML = details.map((line) => `<p>${line}</p>`).join('') + '<p>Click close to start a new life.</p>';
  modal.classList.remove('hidden');
};

const hideModal = () => {
  document.getElementById('modal').classList.add('hidden');
};

const startNewLife = () => {
  state = defaultState();
  initializeRelationships(state);
  state.player.addLog('A new life begins.', ['birth']);
  ui = createUIController({
    state,
    assetsData,
    jobs,
    colleges,
    callbacks: createCallbacks(),
  });
  ui.refresh();
  saveState(state);
};

window.addEventListener('load', init);
