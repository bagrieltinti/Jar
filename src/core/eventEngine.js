// eventEngine.js - Builds candidate events and applies them each year.

import events, { pickIllnessEvent } from '../data/events.js';
import { weightedPick } from './random.js';

export const runYearlyEvents = (player, state) => {
  const stage = player.getLifeStage();
  const candidates = events.filter((event) => {
    if (event.minAge && player.age < event.minAge) return false;
    if (event.maxAge && player.age > event.maxAge) return false;
    if (event.condition && !event.condition(player, state)) return false;
    if (event.lifeStages && !event.lifeStages.includes(stage)) return false;
    return true;
  });

  const extraIllness = pickIllnessEvent(player);
  if (extraIllness) candidates.push(extraIllness);

  const triggered = [];
  const iterations = Math.min(2, candidates.length);
  for (let i = 0; i < iterations; i += 1) {
    const event = weightedPick(candidates);
    if (!event) break;
    triggered.push(event);
    event.apply(player, state, (text) => player.addLog(text));
  }
  return triggered.map((e) => e.id);
};
