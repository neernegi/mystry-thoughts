import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/option";
import { NextRequest, NextResponse } from "next/server";
import UserModel from "@/model/user";
import ThoughtModel from "@/model/thoughts";




export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ thoughtId: string }> }
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
    const params = await context.params;
    const { thoughtId } = params;

    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const thought = await ThoughtModel.findById(thoughtId);
    if (!thought) {
      return Response.json(
        { success: false, message: "Thought not found" },
        { status: 404 }
      );
    }

    // Check if the user is the owner of the thought
    if (thought.user.toString() !== user._id.toString()) {
      return Response.json(
        { success: false, message: "You can only delete your own thoughts" },
        { status: 403 }
      );
    }

    await ThoughtModel.findByIdAndDelete(thoughtId);

    return Response.json({
      success: true,
      message: "Thought deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting thought:", error);
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

