// health.js - Helper logic for health drift and illness impact.

import illnesses from '../data/illnesses.js';

export const applyYearlyHealthDrift = (player) => {
  const stage = player.getLifeStage();
  let delta = -1;
  if (stage === 'toddler' || stage === 'child') delta = 1;
  if (stage === 'elder') delta = -3;
  player.modifyStat('health', delta);

  const happinessBonus = Math.floor((player.happiness - 50) / 25);
  if (happinessBonus > 0) player.modifyStat('health', happinessBonus);
};

export const tickIllnesses = (player, log) => {
  player.illnesses.forEach((illnessId) => {
    const illness = illnesses.find((i) => i.id === illnessId);
    if (!illness) return;
    player.modifyStat('health', -illness.healthDrainPerYear);
    if (Math.random() < illness.chanceOfDeath && player.health < 35) {
      player.health = 0;
      player.addLog(`My ${illness.name} worsened critically.`, ['health']);
    } else if (Math.random() < illness.chanceToRecover) {
      player.removeIllness(illness.id);
      player.addLog(`I recovered from ${illness.name}.`, ['health']);
    }
  });
};
