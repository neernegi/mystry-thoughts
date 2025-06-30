import dbConnect from "@/lib/dbConnect";
import ConfessionModel from "@/model/confession";
import UserModel from "@/model/user";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/option";

export async function POST(req: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { confession } = await req.json();

    if (!confession || confession.trim() === "") {
      return Response.json(
        { success: false, message: "Thought cannot be empty" },
        { status: 400 }
      );
    }

    const user = await UserModel.findOne({ email: session.user.email });

    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const newConfession = await ConfessionModel.create({
      user: user._id,
      confession,
      repliesToConfession: [],
    });

    return Response.json(
      {
        success: true,
        message: "Confession posted successfully",
        data: newConfession,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error posting thought:", error);
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const confession = await ConfessionModel.find()
      .populate({
        path: "user",
        select: "username anonymousName image",
      })
      .populate({
        path: "repliesToConfession.user",
        model: "User",
        select: "username anonymousName image",
      });
    return Response.json({
      success: true,
      message: "successfully fetched",
      data: confession,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "An error occurred while fetching confessions.",
      },
      { status: 500 }
    );
  }
}


export async function DELETE(req: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { confessionId } = await req.json();

    if (!confessionId) {
      return Response.json(
        { success: false, message: "confessionId is required" },
        { status: 400 }
      );
    }

    // ✅ Fetch the user from DB to get their ObjectId
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // ✅ Find the confession
    const confession = await ConfessionModel.findById(confessionId);
    if (!confession) {
      return Response.json(
        { success: false, message: "Confession not found" },
        { status: 404 }
      );
    }

    // ✅ Compare ObjectIds correctly using .equals
    if (confession.user.equals(user._id)) {
      await ConfessionModel.findByIdAndDelete(confessionId);
      return Response.json({
        success: true,
        message: "Confession deleted successfully",
      });
    } else {
      return Response.json(
        {
          success: false,
          message: "Only the confession owner can delete it",
        },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("Error deleting confession:", error);
    return Response.json(
      { success: false, message: "Server error during deletion" },
      { status: 500 }
    );
  }
}
