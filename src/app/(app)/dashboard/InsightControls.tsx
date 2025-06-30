'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Settings, Play, Pause, RotateCcw } from 'lucide-react';

interface InsightControlsProps {
  isAutoPlaying: boolean;
  onToggleAutoPlay: (enabled: boolean) => void;
  slideSpeed: number;
  onSlideSpeedChange: (speed: number) => void;
  onRestart: () => void;
}

const InsightControls = ({ 
  isAutoPlaying, 
  onToggleAutoPlay, 
  slideSpeed, 
  onSlideSpeedChange,
  onRestart 
}: InsightControlsProps) => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Insight Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto Play Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-play" className="text-sm font-medium">
            Auto Play Insights
          </Label>
          <Switch
            id="auto-play"
            checked={isAutoPlaying}
            onCheckedChange={onToggleAutoPlay}
          />
        </div>

        {/* Slide Speed Control */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Slide Speed: {slideSpeed / 1000}s per slide
          </Label>
          <Slider
            value={[slideSpeed]}
            onValueChange={(value) => onSlideSpeedChange(value[0])}
            min={3000}
            max={15000}
            step={1000}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Fast (3s)</span>
            <span>Slow (15s)</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleAutoPlay(!isAutoPlaying)}
            className="flex-1"
          >
            {isAutoPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Play
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRestart}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InsightControls;