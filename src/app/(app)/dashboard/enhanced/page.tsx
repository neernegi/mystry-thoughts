'use client';

import { useState, useEffect } from 'react';

import { useInsightCache } from '@/hooks/useInsightCache';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InsightStats from '../InsightStats';
import AIInsights from '../AIInsights';
import InsightControls from '../InsightControls';
import InsightHistory from '../InsightHistory';

export default function EnhancedDashboard() {
  const { stats, history, updateCache, clearCache } = useInsightCache();
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [slideSpeed, setSlideSpeed] = useState(8000);

  const handleToggleAutoPlay = (enabled: boolean) => {
    setIsAutoPlaying(enabled);
  };

  const handleSlideSpeedChange = (speed: number) => {
    setSlideSpeed(speed);
  };

  const handleRestart = () => {
    clearCache();
    window.location.reload();
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          AI Insights Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Discover patterns and wisdom from community thoughts and confessions
        </p>
      </div>

      {/* Stats Overview */}
      <InsightStats />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AI Insights - Takes up 2 columns */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="insights" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="insights">Live Insights</TabsTrigger>
              <TabsTrigger value="controls">Controls</TabsTrigger>
            </TabsList>
            
            <TabsContent value="insights" className="space-y-4">
              <AIInsights 
                autoPlay={isAutoPlaying}
                slideSpeed={slideSpeed}
              />
            </TabsContent>
            
            <TabsContent value="controls">
              <InsightControls
                isAutoPlaying={isAutoPlaying}
                onToggleAutoPlay={handleToggleAutoPlay}
                slideSpeed={slideSpeed}
                onSlideSpeedChange={handleSlideSpeedChange}
                onRestart={handleRestart}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <InsightHistory />
          
          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-100 dark:border-blue-800">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Quick Actions
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <p>• Insights auto-generate every 50 seconds</p>
              <p>• Each insight shows 5 themed slides</p>
              <p>• Mix of thoughts and confessions</p>
              <p>• Powered by Google Gemini AI</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
