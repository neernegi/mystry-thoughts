import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/option";
import MessageRequest from "@/model/messageRequest";
import Chat from "@/model/Chat";
import { NextResponse } from "next/server";
import UserModel from "@/model/user";
import UserMatch from "@/model/userMatch";



export async function GET(req: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const userId = session?.user?._id;
    const requests = await MessageRequest.find({
      $or: [{ sender: userId }, { recipient: userId }],
    })
      .populate("sender", "username")
      .populate("recipient", "username")
      .sort({ createdAt: -1 });

    return Response.json({
      success: true,
      message: "message request fetched successfully",
      requests,
    });
  } catch (error) {
    console.log(error, "error while fetching message request");
  }
}
