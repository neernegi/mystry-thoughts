// components/dashboard/AllInsight.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SlideContent {
  heading: string;
  bulletPoints: string[];
}

interface InsightData {
  id: string;
  type: "thought" | "confession";
  originalContent: string;
  slides: SlideContent[];
  timestamp: Date;
}

const AIIInsight = ({ type }: { type: "thought" | "confession" }) => {
  const [currentInsight, setCurrentInsight] = useState<InsightData | null>(
    null
  );
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [insightHistory, setInsightHistory] = useState<InsightData[]>([]);

  // Generate AI insights using Gemini API
  const generateInsight = async (): Promise<InsightData | null> => {
    try {
      setIsLoading(true);

      // Fetch random content based on the component type
      const response = await fetch(`/api/dashboard/random-${type}`);
      if (!response.ok) throw new Error("Failed to fetch content");

      const content = await response.json();
      if (!content) return null;

      // Generate AI analysis
      const aiResponse = await fetch("/api/ai/generate-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: type === "thought" ? content.thought : content.confession,
          type,
        }),
      });

      if (!aiResponse.ok) throw new Error("Failed to generate AI insight");

      const aiInsight = await aiResponse.json();

      const newInsight = {
        id: content._id,
        type,
        originalContent:
          type === "thought" ? content.thought : content.confession,
        slides: aiInsight.slides,
        timestamp: new Date(),
      };

      // Add to history and set as current
      setInsightHistory((prev) => [...prev, newInsight]);
      return newInsight;
    } catch (error) {
      console.error("Error generating insight:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial insight
  useEffect(() => {
    const loadInitialInsight = async () => {
      const insight = await generateInsight();
      setCurrentInsight(insight);
    };

    loadInitialInsight();
  }, [type]);

  // Clean up old insights (older than 1 day)
  useEffect(() => {
    const cleanupOldInsights = () => {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      setInsightHistory((prev) =>
        prev.filter((insight) => new Date(insight.timestamp) > oneDayAgo)
      );
    };

    // Run cleanup every hour
    const interval = setInterval(cleanupOldInsights, 3600000);
    return () => clearInterval(interval);
  }, []);

  const handleNextSlide = () => {
    if (currentSlideIndex < 4) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else {
      // If on last slide, generate new insight
      generateInsight().then((insight) => {
        if (insight) {
          setCurrentInsight(insight);
          setCurrentSlideIndex(0);
        }
      });
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full h-96 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="animate-spin">
              <Brain className="w-12 h-12 text-purple-600 mx-auto" />
            </div>
            <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
              AI is generating insights...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentInsight) {
    return (
      <Card className="w-full h-96 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="text-lg font-medium text-gray-500">
              No insights available yet
            </p>
            <Button onClick={() => generateInsight()}>Generate Insight</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentSlide = currentInsight.slides[currentSlideIndex];

  return (
    <Card className="w-full h-96 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-0 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
              {currentInsight.type === "thought" ? (
                <Brain className="w-5 h-5 text-white" />
              ) : (
                <MessageCircle className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {currentInsight.type === "thought"
                  ? "Thought Insights"
                  : "Confession Insights"}
              </CardTitle>
              <Badge variant="secondary" className="text-xs mt-1">
                Slide {currentSlideIndex + 1}/5
              </Badge>
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="flex justify-center gap-2 mt-2">
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlideIndex
                  ? "bg-purple-500 scale-125"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
            />
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 h-[calc(100%-120px)]">
        {/* Original Content Preview */}
        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border border-purple-100 dark:border-purple-800">
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            "{currentInsight.originalContent}"
          </p>
        </div>

        {/* Current Slide */}
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {currentSlide.heading}
          </h3>

          <div className="space-y-2">
            {currentSlide.bulletPoints.map((point, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mt-2 flex-shrink-0" />
                <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevSlide}
          disabled={currentSlideIndex === 0}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button variant="outline" onClick={handleNextSlide} className="gap-1">
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AIIInsight;
