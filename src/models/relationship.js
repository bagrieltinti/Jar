// relationship.js - Relationship stats linking Player and NPCs.

export class Relationship {
  constructor({ npcId, relationshipType = 'other', closeness = 50, respect = 50, romantic = 0, conflict = 20 }) {
    this.npcId = npcId;
    this.relationshipType = relationshipType;
    this.closeness = closeness;
    this.respect = respect;
    this.romantic = romantic;
    this.conflict = conflict;
  }
}
