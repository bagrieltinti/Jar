// asset.js - Utility for instancing purchased assets.

export class Asset {
  constructor(definition) {
    Object.assign(this, definition);
    this.purchaseYear = definition.purchaseYear ?? 0;
  }
}
