// npc.js - Lightweight NPC descriptor used for relationships and events.

export class NPC {
  constructor({ id, name, age, relationshipType, occupation, personalityTraits }) {
    this.id = id;
    this.name = name;
    this.age = age;
    this.relationshipType = relationshipType;
    this.occupation = occupation ?? 'Unknown';
    this.personalityTraits = personalityTraits ?? [];
    this.mood = 60;
    this.health = 80;
    this.alive = true;
  }
}
