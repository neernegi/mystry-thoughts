// app/api/user-match/[matchId]/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import UserMatch from "@/model/userMatch";
import ChatRoom from "@/model/chatRoom";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/option";
import UserModel from "@/model/user";
import { notifyMatchAcceptance } from "@/socket/socket";
import { Types } from "mongoose";


export async function POST(
  req: Request,
  { params }: { params: { matchId: string } }
) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { action } = await req.json(); 
    const currentUser = await UserModel.findOne({ email: session.user.email });
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const match = await UserMatch.findById(params.matchId)
      .populate("chatRoom")
      .populate("user1")
      .populate("user2");

    if (!match) {
      return NextResponse.json(
        { success: false, message: "Match not found" },
        { status: 404 }
      );
    }

    // Verify the current user is user2 (the one being matched with)
    if (!(match.user2 as unknown as Types.ObjectId).equals(currentUser._id)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to respond to this match" },
        { status: 403 }
      );
    }

    if (action === "accept") {
      match.status = "accepted";
      await match.save();
      
      // Notify the other user about acceptance
      await notifyMatchAcceptance(
        match._id.toString(),
        currentUser._id.toString()
      );
      
      return NextResponse.json({
        success: true,
        message: "Match accepted successfully!",
        match
      });
    } else if (action === "reject") {
      // Delete the chat room and match
      await ChatRoom.findByIdAndDelete(match.chatRoom._id);
      await UserMatch.findByIdAndDelete(match._id);
      
      return NextResponse.json({
        success: true,
        message: "Match rejected and deleted successfully!"
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid action" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error responding to match:", error);
    return NextResponse.json(
      { success: false, message: "Error responding to match" },
      { status: 500 }
    );
  }
}