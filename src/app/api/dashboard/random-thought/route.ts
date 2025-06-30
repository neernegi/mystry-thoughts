import dbConnect from '@/lib/dbConnect';
import ThoughtModel from '@/model/thoughts';
import { NextRequest, NextResponse } from 'next/server';


export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get total count of thoughts
    const count = await ThoughtModel.countDocuments();
    
    if (count === 0) {
      return NextResponse.json(null);
    }
    
    // Generate random index
    const randomIndex = Math.floor(Math.random() * count);
    
    // Get random thought
    const randomThought = await ThoughtModel
      .findOne()
      .skip(randomIndex)
      .select('thought _id createdAt')
      .lean();
    
    return NextResponse.json(randomThought);
  } catch (error) {
    console.error('Error fetching random thought:', error);
    return NextResponse.json(
      { error: 'Failed to fetch random thought' },
      { status: 500 }
    );
  }
}