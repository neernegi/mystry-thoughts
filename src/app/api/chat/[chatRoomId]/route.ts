import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/option";
import Chat from "@/model/Chat";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ chatRoomId: string }> }) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session || !session.user?._id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const paramId = await params
    const chatRoom = await Chat.findById(paramId.chatRoomId)
      .populate('participants', 'username anonymousName image')
      .populate('messages.sender', 'username anonymousName image');

    if (!chatRoom) {
      return NextResponse.json(
        { success: false, message: "Chat room not found" },
        { status: 404 }
      );
    }

    // Check if current user is a participant
    const isParticipant = chatRoom.participants.some(
      (participant: any) => participant._id.toString() === session.user._id
    );

    if (!isParticipant) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access to chat" },
        { status: 403 }
      );
    }

    // Find the other user (matched user)
    const matchedUser = chatRoom.participants.find(
      (participant: any) => participant._id.toString() !== session.user._id
    );

    // Format messages for response
    const formattedMessages = chatRoom.messages.map((message: any) => ({
      _id: message._id.toString(),
      content: message.content,
      sender: {
        _id: message.sender._id.toString(),
        username: message.sender.username,
        anonymousName: message.sender.anonymousName,
        image: message.sender.image
      },
      timestamp: message.timestamp.toISOString()
    }));

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      matchedUser: {
        _id: matchedUser._id.toString(),
        anonymousName: matchedUser.anonymousName,
        image: matchedUser.image,
        username: matchedUser.username
      }
    });

  } catch (error) {
    console.error("Error fetching chat data:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching chat data",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ chatRoomId: string }> }) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session || !session.user?._id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { content } = await req.json();
     const paramId = await params

    // Find and update chat room
    const chatRoom = await Chat.findByIdAndUpdate(
      paramId.chatRoomId,
      {
        $push: {
          messages: {
            sender: session.user._id,
            content
          }
        }
      },
      { new: true }
    ).populate('messages.sender', 'username anonymousName image');

    if (!chatRoom) {
      return NextResponse.json(
        { success: false, message: "Chat room not found" },
        { status: 404 }
      );
    }

    // Get the newly added message
    const newMessage = chatRoom.messages[chatRoom.messages.length - 1];

    return NextResponse.json({
      success: true,
      message: {
        _id: newMessage._id.toString(),
        content: newMessage.content,
        sender: {
          _id: newMessage.sender._id.toString(),
          username: newMessage.sender.username,
          anonymousName: newMessage.sender.anonymousName,
          image: newMessage.sender.image
        },
        timestamp: newMessage.timestamp.toISOString()
      }
    });

  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error sending message",
      },
      { status: 500 }
    );
  }
}