import { NextRequest, NextResponse } from 'next/server';


import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/option';
import dbConnect from '@/lib/dbConnect';
import ConfessionModel from '@/model/confession';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { confessionId: string; replyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { confessionId, replyId } = params;

    // Find the confession
    const confession = await ConfessionModel.findById(confessionId);
    if (!confession) {
      return NextResponse.json({ error: 'Confession not found' }, { status: 404 });
    }

    // Find the reply to delete
    const replyToDelete = confession.repliesToConfession.find(
      (reply: any) => reply._id.toString() === replyId
    );

    if (!replyToDelete) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
    }

    // Check if the user is the owner of the reply
    if (replyToDelete.user.toString() !== session.user._id) {
      return NextResponse.json(
        { error: 'You can only delete your own replies' },
        { status: 403 }
      );
    }

    // Remove the reply
    confession.repliesToConfession = confession.repliesToConfession.filter(
      (reply: any) => reply._id.toString() !== replyId
    );

    await confession.save();

    return NextResponse.json({
      success: true,
      message: 'Reply deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting reply:', error);
    return NextResponse.json(
      { error: 'Failed to delete reply' },
      { status: 500 }
    );
  }
}