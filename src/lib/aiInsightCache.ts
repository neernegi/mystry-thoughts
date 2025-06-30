interface CacheItem {
  id: string;
  type: 'thought' | 'confession';
  content: string;
  slides: any[];
  timestamp: Date;
  viewCount: number;
}

class AIInsightCache {
  private cache: Map<string, CacheItem> = new Map();
  private maxSize = 50;
  private recentHistory: CacheItem[] = [];

  add(item: CacheItem) {
    // Remove oldest if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (typeof oldestKey === 'string') {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(item.id, item);
    
    // Add to recent history
    this.recentHistory.unshift(item);
    if (this.recentHistory.length > 20) {
      this.recentHistory.pop();
    }

    // Store in localStorage for persistence (if available)
    this.saveToStorage();
  }

  get(id: string): CacheItem | undefined {
    const item = this.cache.get(id);
    if (item) {
      item.viewCount++;
      this.saveToStorage();
    }
    return item;
  }

  getRecentHistory(): CacheItem[] {
    return this.recentHistory.slice(0, 10);
  }

  getStats() {
    const thoughts = Array.from(this.cache.values()).filter(item => item.type === 'thought');
    const confessions = Array.from(this.cache.values()).filter(item => item.type === 'confession');
    const totalViews = Array.from(this.cache.values()).reduce((sum, item) => sum + item.viewCount, 0);
    
    return {
      totalThoughts: thoughts.length,
      totalConfessions: confessions.length,
      insightsGenerated: this.cache.size,
      avgEngagement: this.cache.size > 0 ? Math.round(totalViews / this.cache.size) : 0
    };
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined') {
        // Use in-memory storage only, no localStorage
        // This is handled by the component state
      }
    } catch (error) {
      console.warn('Could not save to storage:', error);
    }
  }

  clear() {
    this.cache.clear();
    this.recentHistory = [];
  }
}

export const aiInsightCache = new AIInsightCache();