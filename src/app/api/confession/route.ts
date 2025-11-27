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
        { success: false, message: "Confession cannot be empty" },
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
    });

    // Populate user details immediately for the frontend to use
    await newConfession.populate("user", "username anonymousName image");

    return Response.json(
      {
        success: true,
        message: "Confession posted successfully",
        data: newConfession,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error posting confession:", error);
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
    // Optimized: Only populate the user, removed nested reply population
    const confessions = await ConfessionModel.find()
      .sort({ createdAt: -1 }) // Show newest first
      .populate({
        path: "user",
        select: "username anonymousName image",
      });

    return Response.json({
      success: true,
      message: "Successfully fetched",
      data: confessions,
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