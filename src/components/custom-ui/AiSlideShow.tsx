'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Brain, Heart, Lightbulb, MessageCircle } from 'lucide-react';

interface AISlide {
  _id: string;
  slides: Array<{
    title: string;
    type: 'thought' | 'confession';
    keyTerms: Array<{
      heading: string;
      points: string[];
    }>;
    aiFeatures: Array<{
      name: string;
      description: string;
      response: string;
    }>;
  }>;
  thoughtId: {
    content: string;
  };
  confessionId: {
    content: string;
  };
  createdAt: string;
}

export default function AISlideShow() {
  const [slides, setSlides] = useState<AISlide | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const response = await fetch('/api/slides');
      if (response.ok) {
        const data = await response.json();
        setSlides(data);
      }
    } catch (error) {
      console.error('Error fetching slides:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewSlides = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/slides', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setSlides(data);
        setCurrentSlide(0);
      }
    } catch (error) {
      console.error('Error generating slides:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <Brain className="h-12 w-12 animate-pulse mx-auto mb-4" />
            <p>AI is analyzing thoughts and confessions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!slides || !slides.slides.length) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="mb-4">No AI insights available yet.</p>
            <Button onClick={generateNewSlides}>Generate Insights</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const slide = slides.slides[currentSlide];
  const isThought = slide.type === 'thought';
  const content = isThought ? slides.thoughtId.content : slides.confessionId.content;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <Card className={`${isThought ? 'border-blue-200 bg-blue-50' : 'border-purple-200 bg-purple-50'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isThought ? (
                <Lightbulb className="h-6 w-6 text-blue-600" />
              ) : (
                <Heart className="h-6 w-6 text-purple-600" />
              )}
              <CardTitle className={isThought ? 'text-blue-900' : 'text-purple-900'}>
                {slide.title}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                disabled={currentSlide === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentSlide + 1} / {slides.slides.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentSlide(Math.min(slides.slides.length - 1, currentSlide + 1))}
                disabled={currentSlide === slides.slides.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription className="text-sm italic">
            "{content.length > 100 ? content.substring(0, 100) + '...' : content}"
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Key Terms Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Key Insights</h3>
            <div className="space-y-4">
              {slide.keyTerms.map((term, index) => (
                <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-medium mb-2">{term.heading}</h4>
                  <ul className="space-y-1">
                    {term.points.map((point, pointIndex) => (
                      <li key={pointIndex} className="flex items-start gap-2 text-sm">
                        <span className="w-1.5 h-1.5 bg-current rounded-full mt-2 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* AI Features Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">AI Analysis</h3>
            <div className="grid gap-4">
              {slide.aiFeatures.map((feature, index) => (
                <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    {feature.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">{feature.description}</p>
                  <p className="text-sm">{feature.response}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Control Buttons */}
      <div className="flex justify-center gap-4">
        <Button onClick={generateNewSlides} variant="outline">
          Generate New Insights
        </Button>
        <Button onClick={fetchSlides} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Expiry Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Created: {new Date(slides.createdAt).toLocaleDateString()} • 
          Expires in 2 days • 
          New insights generated automatically
        </p>
      </div>
    </div>
  );
}