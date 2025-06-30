import dbConnect from '@/lib/dbConnect';
import ConfessionModel from '@/model/confession';
import { NextRequest, NextResponse } from 'next/server';


export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    // Get total count of confessions
    const count = await ConfessionModel.countDocuments();
    
    if (count === 0) {
      return NextResponse.json(null);
    }
    
    // Generate random index
    const randomIndex = Math.floor(Math.random() * count);
    
    // Get random confession
    const randomConfession = await ConfessionModel
      .findOne()
      .skip(randomIndex)
      .select('confession _id createdAt')
      .lean();
    
    return NextResponse.json(randomConfession);
  } catch (error) {
    console.error('Error fetching random confession:', error);
    return NextResponse.json(
      { error: 'Failed to fetch random confession' },
      { status: 500 }
    );
  }
}
