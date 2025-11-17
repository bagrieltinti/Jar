// components.js - DOM helpers for cards, stats and modals.

import { formatMoney } from '../utils/math.js';

export const renderLog = (logEntriesEl, logs) => {
  logEntriesEl.innerHTML = logs
    .map(
      (entry) => `
      <div class="log-entry">
        <div class="log-age">Age ${entry.age}</div>
        <div>${entry.text}</div>
      </div>`
    )
    .join('');
};

export const renderStatsBars = (container, player) => {
  const stats = [
    ['health', 'Health'],
    ['happiness', 'Happiness'],
    ['smarts', 'Smarts'],
    ['looks', 'Looks'],
    ['comedy', 'Comedy'],
  ];
  container.innerHTML = stats
    .map(
      ([key, label]) => `
      <div class="stats-bar">
        <div class="stats-bar-label">${label} (${player[key]})</div>
        <div class="stats-bar-track">
          <div class="stats-bar-fill" style="width:${player[key]}%"></div>
        </div>
      </div>`
    )
    .join('');
};

export const renderFinanceTab = (container, player, assetsData, colleges, callbacks) => {
  const income = player.career.salaryPerYear;
  const expenses = calculateExpenses(player, colleges);
  const ownedAssets = player.assets.map((a) => `<li>${a.name} (${formatMoney(a.price)})</li>`).join('') || '<li>No assets</li>';

  container.innerHTML = `
    <h3>Finances</h3>
    <p>Money: <strong>${formatMoney(player.money)}</strong></p>
    <p>Annual Income: ${formatMoney(income)} | Estimated Expenses: ${formatMoney(expenses)}</p>
    <section>
      <h4>Available Houses</h4>
      ${assetsData.houses.map((house) => actionCard(house, 'Buy House')).join('')}
    </section>
    <section>
      <h4>Available Cars</h4>
      ${assetsData.cars.map((car) => actionCard(car, 'Buy Car')).join('')}
    </section>
    <section>
      <h4>Collectibles</h4>
      ${assetsData.collectibles.map((item) => actionCard(item, 'Acquire')).join('')}
    </section>
    <section>
      <h4>Your Assets</h4>
      <ul>${ownedAssets}</ul>
    </section>
  `;

  container.querySelectorAll('[data-asset-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.assetId;
      const type = btn.dataset.assetType;
      const asset = assetsData[`${type}s`]?.find((a) => a.id === id) || assetsData.collectibles.find((a) => a.id === id);
      if (asset) callbacks.buyAsset(asset);
    });
  });
};

export const renderRelationshipsTab = (container, player, npcs, callbacks) => {
  container.innerHTML = '<h3>Relationships</h3>';
  player.relationships.forEach((rel) => {
    const npc = npcs.find((n) => n.id === rel.npcId);
    if (!npc) return;
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h4>${npc.name} (${npc.relationshipType})</h4>
      <p>Closeness: ${rel.closeness} | Respect: ${rel.respect} | Conflict: ${rel.conflict}</p>
      <div class="actions">
        <button data-action="spend">Spend Time</button>
        <button data-action="compliment">Compliment</button>
        <button data-action="argue">Argue</button>
        <button data-action="apologize">Apologize</button>
      </div>
    `;
    card.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => callbacks.onRelationshipAction(rel, npc, btn.dataset.action));
    });
    container.appendChild(card);
  });
};

export const renderCareerTab = (container, player, jobs, callbacks) => {
  if (!player.career.currentJobId) {
    container.innerHTML = `
      <h3>Career - Currently Unemployed</h3>
      <p>Browse openings and apply.</p>
      ${jobs.map((job) => actionCard(job, 'Apply')).join('')}
    `;
    container.querySelectorAll('[data-asset-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const job = jobs.find((j) => j.id === btn.dataset.assetId);
        callbacks.apply(job);
      });
    });
  } else {
    container.innerHTML = `
      <h3>${player.career.jobTitle}</h3>
      <p>Salary: ${formatMoney(player.career.salaryPerYear)} | Performance: ${player.career.performance}</p>
      <div class="actions">
        <button class="primary" id="workHarder">Work Harder</button>
        <button class="primary" id="slackOff">Slack Off</button>
      </div>
    `;
    container.querySelector('#workHarder').addEventListener('click', callbacks.workHarder);
    container.querySelector('#slackOff').addEventListener('click', callbacks.slackOff);
  }
};

export const renderEducationTab = (container, player, colleges, callbacks) => {
  const edu = player.education;
  container.innerHTML = `
    <h3>Education - ${edu.currentLevel}</h3>
    <p>Grades: ${edu.grades}</p>
  `;
  const section = document.createElement('section');
  section.innerHTML = '<h4>Colleges</h4>';
  colleges.forEach((college) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h4>${college.name}</h4>
      <p>Yearly Cost: ${formatMoney(college.cost)} | Difficulty: ${college.difficulty}</p>
      <button ${edu.currentCollege === college.id ? 'disabled' : ''}>${edu.currentCollege === college.id ? 'Enrolled' : 'Apply'}</button>
    `;
    card.querySelector('button').addEventListener('click', () => callbacks.applyToCollege(college));
    section.appendChild(card);
  });
  container.appendChild(section);
};

export const renderActivitiesTab = (container, stage, callbacks) => {
  const stageActions = {
    toddler: [{ label: 'Babble endlessly', action: 'babble' }],
    child: [
      { label: 'Play with toys', action: 'play' },
      { label: 'Study', action: 'study' },
    ],
    teen: [
      { label: 'Study harder', action: 'study' },
      { label: 'Hang with friends', action: 'friends' },
      { label: 'Part-time job', action: 'parttime' },
    ],
    youngAdult: [
      { label: 'Exercise', action: 'exercise' },
      { label: 'Go out', action: 'nightout' },
      { label: 'Travel locally', action: 'travel' },
    ],
    adult: [
      { label: 'Family dinner', action: 'family' },
      { label: 'Invest time in hobby', action: 'hobby' },
      { label: 'Volunteer', action: 'volunteer' },
    ],
    elder: [
      { label: 'Relax', action: 'relax' },
      { label: 'Tell stories', action: 'stories' },
      { label: 'Stroll in park', action: 'stroll' },
    ],
  };

  const actions = stageActions[stage] ?? [];
  container.innerHTML = '<h3>Activities</h3>';
  actions.forEach((action) => {
    const btn = document.createElement('button');
    btn.textContent = action.label;
    btn.className = 'primary';
    btn.addEventListener('click', () => callbacks.performAction(action.action));
    container.appendChild(btn);
  });
};

export const renderHealthTab = (container, player, callbacks) => {
  const illnessesList = player.illnesses.map((ill) => `<li>${ill}</li>`).join('') || '<li>No illnesses</li>';
  container.innerHTML = `
    <h3>Health</h3>
    <p>Current health: ${player.health}</p>
    <ul>${illnessesList}</ul>
    <div class="actions">
      <button class="primary" id="doctorBtn">Go to doctor (-$500)</button>
      <button class="primary" id="exerciseBtn">Exercise</button>
      <button class="primary" id="restBtn">Rest for a year</button>
    </div>
  `;
  container.querySelector('#doctorBtn').addEventListener('click', callbacks.doctor);
  container.querySelector('#exerciseBtn').addEventListener('click', callbacks.exercise);
  container.querySelector('#restBtn').addEventListener('click', callbacks.rest);
};

const calculateExpenses = (player, colleges) => {
  let expense = 0;
  player.assets.forEach((asset) => {
    expense += asset.yearlyCost ?? 0;
  });
  if (player.education.currentCollege) {
    const college = colleges.find((c) => c.id === player.education.currentCollege);
    if (college) expense += college.cost;
  }
  return expense;
};

const actionCard = (item, label) => `
  <div class="card">
    <h4>${item.name}</h4>
    <p>Cost: ${formatMoney(item.price)} | Yearly: ${formatMoney(item.yearlyCost ?? 0)}</p>
    <button data-asset-id="${item.id}" data-asset-type="${item.type}">${label}</button>
  </div>
`;
