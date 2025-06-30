import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AISlide from '@/models/AISlide';
import { SlideService } from '@/services/slideService';

const slideService = new SlideService();

export async function GET() {
  try {
    await dbConnect();
    
    // Clean up expired slides
    await AISlide.deleteMany({ expiresAt: { $lt: new Date() } });
    
    // Generate new slides if needed
    await slideService.generateSlides();
    
    return NextResponse.json({ success: true, message: 'Cleanup completed' });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
