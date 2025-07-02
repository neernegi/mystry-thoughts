import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import dbConnect from "@/lib/dbConnect";
import ConfessionModel from "@/model/confession";
import UserModel, { User } from "@/model/user";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { IReply, IConfession } from "@/model/confession";
import { ReplyToConfessionSchema } from "@/schemas/confessionSchema";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ confessionId: string }> }
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
    // Get confessionId from params first
    const params = await context.params;
    if (!params) {
      return Response.json(
        { success: false, message: "Confession ID is required" },
        { status: 400 }
      );
    }

    const requestBody = await req.json();

    const validationResult = ReplyToConfessionSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return Response.json(
        {
          success: false,
          message: "Validation failed",
          errors: validationResult.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { replyConfession } = validationResult.data;

    const user = await UserModel.findOne({ email: session.user.email });

    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const confession = await ConfessionModel.findById(params.confessionId);

    if (!confession) {
      return Response.json(
        { success: false, message: "Confession not found" },
        { status: 404 }
      );
    }

    const newReply = {
      _id: new mongoose.Types.ObjectId(),
      user: user._id,
      replyConfession,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    confession.repliesToConfession.push(newReply);

    await confession.save();

    return Response.json(
      {
        success: true,
        message: "Reply added successfully",
        data: confession,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding reply:", error);
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ confessionId: string }> }
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
    const { replyId } = await req.json();
    if (!replyId) {
      return Response.json(
        { success: false, message: "Reply ID is required" },
        { status: 400 }
      );
    }

    const { confessionId } = await context.params;

    const user = (await UserModel.findOne({
      email: session.user.email,
    })) as User;
    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const confession = await ConfessionModel.findById(confessionId);
    if (!confession) {
      return Response.json(
        { success: false, message: "Confession not found" },
        { status: 404 }
      );
    }

    const confessionWithReplies: IConfession = confession as IConfession;

    confessionWithReplies.repliesToConfession =
      confessionWithReplies.repliesToConfession.filter(
        (reply: IReply): boolean => {
          if (!reply._id) return true;

          const isConfessionOwner =
            user._id.toString() === confessionWithReplies.user.toString();
          const isReplyOwner = reply.user.toString() === user._id.toString();

          if (reply._id.toString() === replyId) {
            if (isConfessionOwner || isReplyOwner) return false; // Delete
          }

          return true; // Keep
        }
      );

    await confession.save();

    return Response.json({
      success: true,
      message: "Reply deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return Response.json({
      success: false,
      message: "Error while deleting reply",
      error,
    });
  }
}
