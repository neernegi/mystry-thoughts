import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/user";
import ThoughtModel from "@/model/thoughts";
import ConfessionModel from "@/model/confession";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { Types } from "mongoose";

export async function GET(
  req: NextRequest,
  context: { params: { identifier: string } }
) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const paramsIdentifier = await context.params;

    // Check if the identifier is a valid ObjectId
    const isObjectId = Types.ObjectId.isValid(paramsIdentifier?.identifier);

    // Find the user by either ID or username
    const user = isObjectId
      ? await UserModel.findById(paramsIdentifier?.identifier).select(
          "username email avatarOptions image gender"
        )
      : await UserModel.findOne({
          username: paramsIdentifier?.identifier,
        }).select("username email avatarOptions image gender");
  

    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Rest of your existing code...
    const thoughts = await ThoughtModel.find({ user: user._id })
      .populate({
        path: "user",
        select: "username anonymousName image",
      })
      .populate({
        path: "thoughtReplies.user",
        model: "User",
        select: "username anonymousName image",
      })
      .sort({ createdAt: -1 });

    const confessions = await ConfessionModel.find({ user: user._id })
      .populate({
        path: "user",
        select: "username anonymousName image",
      })
      .populate({
        path: "repliesToConfession.user",
        model: "User",
        select: "username anonymousName image",
      })
      .sort({ createdAt: -1 });

    const currentUser = await UserModel.findOne({ email: session.user.email });
    const isOwner =
      currentUser && currentUser._id.toString() === user._id.toString();

    return Response.json({
      success: true,
      message: "Profile data fetched successfully",
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          image: user.image,
          gender: user.gender,
          anonymousName: user.anonymousName,
          avatarOptions: user.avatarOptions,
          createdAt: user?.createdAt,
        },
        thoughts,
        confessions,
        isOwner,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
