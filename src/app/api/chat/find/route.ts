import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/option";
import Chat from "@/model/Chat";
import { NextResponse } from "next/server";


/*
export async function GET(req: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const url = new URL(req.url);
    const participantsParam = url.searchParams.get('participants');
    
    if (!participantsParam) {
      return NextResponse.json(
        { success: false, message: "Participants parameter required" },
        { status: 400 }
      );
    }

    // Parse participants from query string
    const participants = participantsParam.split(',');
    
    if (participants.length !== 2) {
      return NextResponse.json(
        { success: false, message: "Exactly 2 participants required" },
        { status: 400 }
      );
    }

    // Find chat room with these participants
    const chatRoom = await Chat.findOne({
      participants: { $all: participants, $size: 2 }
    }).populate('participants', 'username anonymousName image');

    if (!chatRoom) {
      return NextResponse.json(
        { success: false, message: "Chat room not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Chat room found successfully",
      chatRoom
    });

  } catch (error) {
    console.error("Error finding chat room:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error finding chat room",
      },
      { status: 500 }
    );
  }
}


*/


// Update your GET route in app/api/chat/find/route.ts
export async function GET(req: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const url = new URL(req.url);
    const participantsParam = url.searchParams.get('participants');
    
    if (!participantsParam) {
      return NextResponse.json(
        { success: false, message: "Participants parameter required" },
        { status: 400 }
      );
    }

    const participants = participantsParam.split(',');
    
    if (participants.length !== 2) {
      return NextResponse.json(
        { success: false, message: "Exactly 2 participants required" },
        { status: 400 }
      );
    }

    const chatRoom = await Chat.findOne({
      participants: { $all: participants, $size: 2 }
    })
    .populate('participants', 'username anonymousName image')
    .populate({
      path: 'messages',
      options: { sort: { timestamp: -1 }, limit: 1 },
      populate: { path: 'sender', select: 'username anonymousName image' }
    });

    if (!chatRoom) {
      return NextResponse.json(
        { success: false, message: "Chat room not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Chat room found successfully",
      chatRoom: {
        ...chatRoom.toObject(),
        lastMessage: chatRoom.messages[0] || null
      }
    });

  } catch (error) {
    console.error("Error finding chat room:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error finding chat room",
      },
      { status: 500 }
    );
  }
}