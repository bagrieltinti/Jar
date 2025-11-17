// storage.js - Simple LocalStorage persistence helpers.

const STORAGE_KEY = 'lifeSimSaveV1';

export const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Unable to save state', err);
  }
};

export const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Unable to load state', err);
    return null;
  }
};

export const clearState = () => {
  localStorage.removeItem(STORAGE_KEY);
};
