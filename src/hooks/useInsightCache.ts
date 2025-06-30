import { useState, useEffect } from 'react';
import { aiInsightCache } from '@/lib/aiInsightCache';

export function useInsightCache() {
  const [stats, setStats] = useState(aiInsightCache.getStats());
  const [history, setHistory] = useState(aiInsightCache.getRecentHistory());

  const updateCache = () => {
    setStats(aiInsightCache.getStats());
    setHistory(aiInsightCache.getRecentHistory());
  };

  useEffect(() => {
    // Update every 30 seconds
    const interval = setInterval(updateCache, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    history,
    updateCache,
    clearCache: () => {
      aiInsightCache.clear();
      updateCache();
    }
  };
}
