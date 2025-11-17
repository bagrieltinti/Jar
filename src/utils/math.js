// math.js - helper math utilities shared across modules.
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
export const formatMoney = (value) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
