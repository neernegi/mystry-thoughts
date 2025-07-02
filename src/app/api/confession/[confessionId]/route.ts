import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/option";
import UserModel from "@/model/user";
import ConfessionModel from "@/model/confession";
import { NextRequest } from "next/server";



export async function DELETE(
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
    const params = await context.params;
    const { confessionId } = params;

    const user = await UserModel.findOne({ email: session.user.email });
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

    // Check if the user is the owner of the confession
    if (confession.user.toString() !== user._id.toString()) {
      return Response.json(
        { success: false, message: "You can only delete your own confessions" },
        { status: 403 }
      );
    }

    await ConfessionModel.findByIdAndDelete(confessionId);

    return Response.json({
      success: true,
      message: "Confession deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting confession:", error);
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
