
import dbConnect from '@/lib/dbConnect';
import ConfessionModel from '@/model/confession';
import ThoughtModel from '@/model/thoughts';
import { NextRequest, NextResponse } from 'next/server';



export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get recent thoughts and confessions
    const [recentThoughts, recentConfessions] = await Promise.all([
      ThoughtModel.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('thought createdAt _id')
        .lean(),
      ConfessionModel.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('confession createdAt _id')
        .lean()
    ]);

    // Combine and sort by date
    const combined = [
      ...recentThoughts.map(t => ({
        id: t._id.toString(),
        type: 'thought' as const,
        timestamp: t.createdAt,
        preview: t.thought,
        aiSummary: generateQuickSummary(t.thought)
      })),
      ...recentConfessions.map(c => ({
        id: c._id.toString(),
        type: 'confession' as const,
        timestamp: c.createdAt,
        preview: c.confession,
        aiSummary: generateQuickSummary(c.confession)
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);

    return NextResponse.json(combined);
  } catch (error) {
    console.error('Error fetching insight history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insight history' },
      { status: 500 }
    );
  }
}

function generateQuickSummary(content: string): string {
  const words = content.split(' ');
  if (words.length <= 10) return content;
  
  // Simple extractive summary - get first and most meaningful sentence
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const firstSentence = sentences[0]?.trim();
  
  if (firstSentence && firstSentence.length > 20) {
    return firstSentence.substring(0, 80) + '...';
  }
  
  return words.slice(0, 10).join(' ') + '...';
}