'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Brain, MessageCircle, RefreshCw } from 'lucide-react';

interface HistoryItem {
  id: string;
  type: 'thought' | 'confession';
  timestamp: Date;
  preview: string;
  aiSummary: string;
}

const InsightHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/insight-history');
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

 const formatTime = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
    Math.ceil((d.getTime() - Date.now()) / (1000 * 60)),
    'minute'
  );
};

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent AI Insights
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchHistory}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No insights generated yet. Visit the dashboard to see AI insights!
          </p>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="border-l-4 border-purple-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  {item.type === 'thought' ? (
                    <Brain className="w-4 h-4 text-blue-600" />
                  ) : (
                    <MessageCircle className="w-4 h-4 text-red-600" />
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {item.type}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatTime(item.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                  "{item.preview.substring(0, 100)}..."
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  AI: {item.aiSummary}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InsightHistory;