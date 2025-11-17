// assets.js - Registry of houses, cars, and collectibles.

const houses = [
  { id: 'tiny_apartment', type: 'house', name: 'Tiny Apartment', price: 25000, yearlyCost: 1500, happinessBonus: 3 },
  { id: 'suburban_home', type: 'house', name: 'Suburban Home', price: 120000, yearlyCost: 4500, happinessBonus: 8 },
  { id: 'coastal_villa', type: 'house', name: 'Coastal Villa', price: 450000, yearlyCost: 12000, happinessBonus: 15 },
];

const cars = [
  { id: 'used_hatchback', type: 'car', name: 'Used Hatchback', price: 6000, yearlyCost: 800, happinessBonus: 2, riskOfBreakdown: 0.15 },
  { id: 'family_sedan', type: 'car', name: 'Family Sedan', price: 22000, yearlyCost: 1500, happinessBonus: 4, riskOfBreakdown: 0.08 },
  { id: 'electric_roadster', type: 'car', name: 'Electric Roadster', price: 95000, yearlyCost: 3500, happinessBonus: 9, riskOfBreakdown: 0.04 },
];

const collectibles = [
  { id: 'lucky_charm', type: 'collectible', name: 'Lucky Charm', price: 500, yearlyCost: 0, happinessBonus: 1 },
  { id: 'vintage_guitar', type: 'collectible', name: 'Vintage Guitar', price: 4500, yearlyCost: 60, happinessBonus: 4 },
  { id: 'rare_comic', type: 'collectible', name: 'Rare Comic', price: 12000, yearlyCost: 0, happinessBonus: 6 },
];

export default { houses, cars, collectibles };
