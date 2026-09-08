class CacheManager {
  constructor() {
    this.cache = new Map();
    this.layers = {
      app: new Map(),
      routes: new Map(),
      views: new Map(),
      config: new Map(),
    };
  }

  set(layer, key, value, ttlSeconds = 300) {
    const targetMap = this.layers[layer] || this.cache;
    const expiresAt = Date.now() + ttlSeconds * 1000;
    targetMap.set(key, { value, expiresAt });
  }

  get(layer, key) {
    const targetMap = this.layers[layer] || this.cache;
    const item = targetMap.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      targetMap.delete(key);
      return null;
    }
    return item.value;
  }

  delete(layer, key) {
    const targetMap = this.layers[layer] || this.cache;
    return targetMap.delete(key);
  }

  clear(layer) {
    if (layer && this.layers[layer]) {
      this.layers[layer].clear();
    } else {
      this.cache.clear();
      Object.keys(this.layers).forEach((k) => this.layers[k].clear());
    }
  }

  getStats() {
    let totalEntries = this.cache.size;
    const layerStats = {};
    let totalBytesApprox = 0;

    Object.keys(this.layers).forEach((k) => {
      const size = this.layers[k].size;
      layerStats[k] = size;
      totalEntries += size;
      for (const [key, val] of this.layers[k].entries()) {
        try {
          totalBytesApprox += (key.length + JSON.stringify(val.value || '').length) * 2;
        } catch {
          totalBytesApprox += 512;
        }
      }
    });

    const sizeKB = (totalBytesApprox / 1024).toFixed(2);
    return {
      totalEntries,
      sizeKB: `${sizeKB} KB`,
      layerStats,
      lastCleared: this.lastCleared || new Date().toISOString(),
    };
  }
}

export const cache = new CacheManager();
