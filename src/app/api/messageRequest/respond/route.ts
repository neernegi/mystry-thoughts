import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/option";
import { NextResponse } from "next/server";
import UserModel from "@/model/user";
import messageRequest from "@/model/messageRequest";

import Chat from "@/model/Chat";
import UserMatch from "@/model/userMatch";

export async function POST(req: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const { requestId, accept } = await req.json();

  try {
    const currentUser = await UserModel.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const request = await messageRequest
      .findById(requestId)
      .populate("sender", "username anonymousName image _id")
      .populate("recipient", "username anonymousName image _id");

    if (!request) {
      return NextResponse.json(
        { success: false, message: "Message request not found" },
        { status: 404 }
      );
    }

    if (request.recipient._id.toString() !== currentUser._id.toString()) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to respond to this request" },
        { status: 403 }
      );
    }

    // Update request status
    request.status = accept ? "accepted" : "rejected";
    await request.save();

    // Update related match status
    if (request.relatedMatch) {
      await UserMatch.findByIdAndUpdate(request.relatedMatch, {
        status: accept ? "accepted" : "rejected",
      });
    }

    if (accept) {
      // If accepted, create or find chat
      const existingChat = await Chat.findOne({
        participants: { $all: [request.sender._id, request.recipient._id] },
      });

      let chatRoom = existingChat;
      if (!existingChat) {
        chatRoom = await Chat.create({
          participants: [request.sender._id, request.recipient._id],
          messages: [],
        });
      }

      return NextResponse.json({
        success: true,
        message: "Message request accepted successfully",
        data: {
          request,
          chatRoom: {
            _id: chatRoom._id,
          },
        },
      });
    } else {
      // ✅ Add this return for the "reject" case
      return NextResponse.json({
        success: true,
        message: "Message request rejected successfully",
      });
    }
  } catch (error) {
    console.error("Error responding to message request:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error responding to message request",
      },
      { status: 500 }
    );
  }
}
