'use client'


import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

function InfoCards() {
  const keyTerms = [
    {
      icon: "🌐",
      title: "Server Components",
      description: "React components that render on the server for better performance"
    },
    {
      icon: "🔀",
      title: "Route Groups",
      description: "Next.js feature for organizing routes without affecting URL structure"
    },
    {
      icon: "📡",
      title: "Streaming",
      description: "Technique for progressively rendering UI components"
    },
    {
      icon: "⏳",
      title: "Suspense",
      description: "React feature for handling loading states"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br to-gray-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Key Terms Card */}
        <Card className="relative overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          {/* Decorative elements */}
          <div className="absolute top-4 left-4 w-12 h-1 bg-gradient-to-r from-pink-500 to-red-500 rounded-full"></div>
          <div className="absolute top-6 right-6 w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="absolute bottom-6 left-6 w-4 h-4 bg-pink-400 rounded-full"></div>
          <div className="absolute bottom-6 right-6 w-6 h-6 bg-red-500 rounded-full"></div>
          
          <CardHeader className="pb-6 pt-12">
            <CardTitle className="text-2xl font-bold text-gray-900 text-center">
              Key Terms to Know
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6 pb-12">
            {keyTerms.map((term, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-lg">
                  {term.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {term.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {term.description}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Pagination dots */}
            <div className="flex justify-center items-center space-x-2 pt-8">
              <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
              <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
              <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Overview Card */}
        <Card className="relative overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          {/* Decorative elements */}
          <div className="absolute top-4 left-4 w-12 h-1 bg-gradient-to-r from-pink-500 to-red-500 rounded-full"></div>
          <div className="absolute bottom-6 left-6 w-4 h-4 bg-pink-400 rounded-full"></div>
          <div className="absolute bottom-6 right-6 w-6 h-6 bg-red-500 rounded-full"></div>
          
          <CardHeader className="pb-6 pt-12">
            <CardTitle className="text-2xl font-bold text-gray-900 text-center">
              Quick Overview
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pb-12">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-lg">
                💝
              </div>
              <div className="flex-1">
                <p className="text-gray-600 leading-relaxed">
                  Comprehensive Next.js 15 course covering everything from fundamentals to advanced deployment strategies.
                </p>
              </div>
            </div>
            
            {/* Pagination dots */}
            <div className="flex justify-center items-center space-x-2 pt-12">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
              <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
              <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
              <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
              <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
              <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default InfoCards;