// uiController.js - Handles DOM updates, tab switching and action wiring.

import { renderLog, renderStatsBars, renderFinanceTab, renderRelationshipsTab, renderCareerTab, renderEducationTab, renderActivitiesTab, renderHealthTab } from './components.js';
import { formatMoney } from '../utils/math.js';

export const createUIController = ({ state, assetsData, jobs, colleges, callbacks }) => {
  const dom = {
    name: document.getElementById('playerName'),
    location: document.getElementById('playerLocation'),
    age: document.getElementById('playerAge'),
    money: document.getElementById('playerMoney'),
    log: document.getElementById('logEntries'),
    stats: document.getElementById('statsBars'),
    summary: document.getElementById('yearSummary'),
    tabs: document.querySelectorAll('.tab-button'),
    tabViews: document.querySelectorAll('.tab-content'),
    tabContent: {
      age: document.getElementById('tab-age'),
      activities: document.getElementById('tab-activities'),
      finance: document.getElementById('tab-finance'),
      relationships: document.getElementById('tab-relationships'),
      career: document.getElementById('tab-career'),
      education: document.getElementById('tab-education'),
      health: document.getElementById('tab-health'),
    },
  };

  dom.tabs.forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  function switchTab(id) {
    dom.tabs.forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === id));
    dom.tabViews.forEach((view) => view.classList.toggle('hidden', view.id !== `tab-${id}`));
  }

  const refresh = () => {
    const { player } = state;
    dom.name.textContent = player.name;
    dom.location.textContent = player.location;
    dom.age.textContent = player.age;
    dom.money.textContent = formatMoney(player.money);
    renderLog(dom.log, player.historyLog.slice(0, 60));
    renderStatsBars(dom.stats, player);
    dom.summary.innerHTML = state.lastSummary.map((line) => `<div>${line}</div>`).join('');

    renderActivitiesTab(dom.tabContent.activities, player.getLifeStage(), { performAction: callbacks.performActivity });
    renderFinanceTab(dom.tabContent.finance, player, assetsData, colleges, { buyAsset: callbacks.buyAsset });
    renderRelationshipsTab(dom.tabContent.relationships, player, state.npcs, { onRelationshipAction: callbacks.relationshipAction });
    renderCareerTab(dom.tabContent.career, player, jobs, {
      apply: callbacks.applyForJob,
      workHarder: callbacks.workHarder,
      slackOff: callbacks.slackOff,
    });
    renderEducationTab(dom.tabContent.education, player, colleges, { applyToCollege: callbacks.applyToCollege });
    renderHealthTab(dom.tabContent.health, player, {
      doctor: callbacks.doctorVisit,
      exercise: callbacks.exercise,
      rest: callbacks.rest,
    });
  };

  return { refresh, switchTab };
};
