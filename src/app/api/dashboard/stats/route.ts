import dbConnect from '@/lib/dbConnect';
import ConfessionModel from '@/model/confession';
import ThoughtModel from '@/model/thoughts';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get counts
    const [thoughtCount, confessionCount] = await Promise.all([
      ThoughtModel.countDocuments(),
      ConfessionModel.countDocuments()
    ]);

    // Calculate engagement metrics
    const thoughtsWithReplies = await ThoughtModel.countDocuments({
      'thoughtReplies.0': { $exists: true }
    });
    
    const confessionsWithReplies = await ConfessionModel.countDocuments({
      'repliesToConfession.0': { $exists: true }
    });

    const totalContent = thoughtCount + confessionCount;
    const totalWithReplies = thoughtsWithReplies + confessionsWithReplies;
    const avgEngagement = totalContent > 0 ? Math.round((totalWithReplies / totalContent) * 100) : 0;

    // Simulate insights generated (you can store this in a separate collection)
    const insightsGenerated = Math.floor(totalContent * 0.3); // Rough estimate

    return NextResponse.json({
      totalThoughts: thoughtCount,
      totalConfessions: confessionCount,
      insightsGenerated,
      avgEngagement
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}