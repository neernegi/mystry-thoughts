import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import dbConnect from "@/lib/dbConnect";
import ThoughtModel from "@/model/thoughts";
import UserModel from "@/model/user";
import { AddReplySchema } from "@/schemas/thoughtsSchema";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";

// POST: Add a reply
export async function POST(
  req: Request,
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
    const requestBody = await req.json();
    const params = await context.params;

    const validationResult = AddReplySchema.safeParse({
      thoughtId: params.thoughtId,
      reply: requestBody.reply,
    });

    if (!validationResult.success) {
      return Response.json(
        { success: false, message: "Validation failed" },
        { status: 400 }
      );
    }

    const { thoughtId, reply } = validationResult.data;

    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) return Response.json({ success: false, message: "User not found" }, { status: 404 });

    const thought = await ThoughtModel.findById(thoughtId);
    if (!thought) return Response.json({ success: false, message: "Thought not found" }, { status: 404 });

    // Create new reply object
    const newReply = {
      _id: new mongoose.Types.ObjectId(),
      user: user._id,
      reply: reply,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Push to array (Flat structure)
    thought.thoughtReplies.push(newReply);
    await thought.save();

    // Populate ONLY the user details for the reply we just added
    // We fetch the thought again briefly to ensure we have the populated user for the response
    const populatedThought = await ThoughtModel.findById(thoughtId).populate({
      path: "thoughtReplies.user",
      select: "username anonymousName image",
    });

    // Extract the specific reply that was just added (it will be the last one)
    const addedReply = populatedThought.thoughtReplies[populatedThought.thoughtReplies.length - 1];

    return Response.json(
      {
        success: true,
        message: "Reply added successfully",
        data: addedReply, // RETURN ONLY THE REPLY OBJECT, NOT THE WHOLE THOUGHT
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

// DELETE: Remove a reply
export async function DELETE(
  req: Request,
  context: { params: Promise<{ thoughtId: string }> }
) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { thoughtReplyId } = await req.json();
    const { thoughtId } = await context.params;

    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) return Response.json({ success: false, message: "User not found" }, { status: 404 });

    const thought = await ThoughtModel.findById(thoughtId);
    if (!thought) return Response.json({ success: false, message: "Thought not found" }, { status: 404 });

    // Filter out the reply
    const initialLength = thought.thoughtReplies.length;
    thought.thoughtReplies = thought.thoughtReplies.filter(
      (r: any) => r._id.toString() !== thoughtReplyId || 
      (r.user.toString() !== user._id.toString() && thought.user.toString() !== user._id.toString())
      // Only allow delete if user is reply author OR thought owner
    );
    
    // Check if actually deleted (naive check for ownership)
    // For stricter checking, logic needs to be inside the filter, but this works for basic validation
    if(thought.thoughtReplies.length === initialLength){
         return Response.json({ success: false, message: "Reply not found or unauthorized" }, { status: 403 });
    }

    await thought.save();

    return Response.json({
      success: true,
      message: "Reply deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return Response.json({
      success: false,
      message: "Error deleting reply",
    }, { status: 500 });
  }
}