// random.js - Utility functions for deterministic-friendly randomness helpers.

export const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const randFloat = (min, max) => Math.random() * (max - min) + min;
export const chance = (prob) => Math.random() < prob;
export const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const weightedPick = (items, weightKey = 'weight') => {
  const total = items.reduce((sum, item) => sum + (item[weightKey] ?? 1), 0);
  let roll = Math.random() * total;
  for (const item of items) {
    const weight = item[weightKey] ?? 1;
    if (roll < weight) return item;
    roll -= weight;
  }
  return items[items.length - 1];
};
