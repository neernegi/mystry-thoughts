import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import dbConnect from "@/lib/dbConnect";
import ThoughtModel, { IReply } from "@/model/thoughts";
import UserModel from "@/model/user";
import { AddReplySchema } from "@/schemas/thoughtsSchema";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";

export async function POST(
  req: Request,
  context: { params: Promise<{ thoughtId: string }> }
) {
  // EXPLANATION: Connect to MongoDB database
  // This establishes connection before any database operations
  await dbConnect();

  // EXPLANATION: Get user session from NextAuth
  // This checks if user is authenticated and returns session data
  const session = await getServerSession(authOptions);

  // EXPLANATION: Authentication check
  // If no session or no email, user is not authenticated
  if (!session || !session.user?.email) {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  // EXPLANATION: Parse and validate request body
  try {
    const requestBody = await req.json();

    const params = await context.params;
    if (!params) {
      return Response.json(
        { success: false, message: "Confession ID is required" },
        { status: 400 }
      );
    }

    // EXPLANATION: Use Zod to validate the entire request body
    // safeParse() returns success/error instead of throwing
    const validationResult = AddReplySchema.safeParse({
      thoughtId: params.thoughtId, // Include thoughtId from URL params
      reply: requestBody.reply,
      thoughtReplyId: requestBody.thoughtReplyId,
    });

    // EXPLANATION: Handle validation errors
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

    // EXPLANATION: Extract validated data
    const { thoughtId, reply, thoughtReplyId } = validationResult.data;

    // EXPLANATION: Find authenticated user in database
    // Use email from session to find user document
    const user = await UserModel.findOne({ email: session.user.email });

    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // EXPLANATION: Find the thought document
    // Use thoughtId from URL parameters to find specific thought
    const thought = await ThoughtModel.findById(thoughtId);

    if (!thought) {
      return Response.json(
        { success: false, message: "Thought not found" },
        { status: 404 }
      );
    }

    // EXPLANATION: Create new reply object
    // Generate new ObjectId and set all required fields
    const newReply = {
      _id: new mongoose.Types.ObjectId(), // Generate unique ID
      user: user._id, // Reference to user who made reply
      reply: reply, // Validated reply text
      replyOfreplies: [], // Initialize empty nested replies array
      createdAt: new Date(), // Set creation timestamp
      updatedAt: new Date(), // Set update timestamp
    };

    // EXPLANATION: Handle nested vs top-level replies
    if (thoughtReplyId) {
      // This is a nested reply (reply to another reply)

      // EXPLANATION: Recursive function to find parent reply
      // Searches through nested reply structure to find specific reply by ID
      const findAndAddNestedReply = (
        replies: any[], // Array of replies to search
        parentReplyId: string // ID of parent reply we're looking for
      ): boolean => {
        // EXPLANATION: Loop through all replies at current level
        for (const reply of replies) {
          // EXPLANATION: Check if current reply is the parent we want
          if (reply._id.toString() === parentReplyId) {
            reply.replyOfreplies.push(newReply); // Add new reply to this parent
            return true; // Success - found and added
          }

          // EXPLANATION: If this reply has nested replies, search recursively
          if (reply.replyOfreplies && reply.replyOfreplies.length > 0) {
            if (findAndAddNestedReply(reply.replyOfreplies, parentReplyId)) {
              return true; // Found in nested replies
            }
          }
        }
        return false; // Not found at this level
      };

      // EXPLANATION: Execute the search and add operation
      const found = findAndAddNestedReply(
        thought.thoughtReplies,
        thoughtReplyId
      );

      if (!found) {
        return Response.json(
          { success: false, message: "Parent reply not found" },
          { status: 404 }
        );
      }
    } else {
      // EXPLANATION: This is a top-level reply (reply directly to thought)
      // Add to main thoughtReplies array
      thought.thoughtReplies.push(newReply);
    }

    // EXPLANATION: Save the updated thought document to database
    // This persists all changes including the new reply
    await thought.save();

    // EXPLANATION: Populate user information for response
    // This replaces ObjectIds with actual user data (username, email)
    await thought.populate("user", "username email");
    await thought.populate("thoughtReplies.user", "username email");

    // EXPLANATION: Return success response with updated thought data
    return Response.json(
      {
        success: true,
        message: "Reply added successfully",
        data: thought,
      },
      { status: 201 }
    );
  } catch (error) {
    // EXPLANATION: Handle any unexpected errors
    console.error("Error adding reply:", error);
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const { thoughtReplyId } = await req.json();
    if (!thoughtReplyId) {
      return Response.json(
        { success: false, message: "Reply ID is required" },
        { status: 400 }
      );
    }

    const { thoughtId } = await context.params;

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

    const isOwner = thought.user.toString() === user._id.toString();
    let modified = false;

    // Remove top-level reply if author or owner
    thought.thoughtReplies = thought.thoughtReplies.filter((reply: IReply) => {
      if (reply._id?.toString() === thoughtReplyId) {
        const isAuthor = reply.user.toString() === user._id.toString();
        if (isAuthor || isOwner) {
          modified = true;
          return false; // remove
        }
      }

      // Also check nested replies
      reply.replyOfreplies = (reply.replyOfreplies || []).filter(
        (nested: IReply) => {
          if (nested._id?.toString() === thoughtReplyId) {
            const isNestedAuthor =
              nested.user.toString() === user._id.toString();
            if (isNestedAuthor || isOwner) {
              modified = true;
              return false; // remove
            }
          }
          return true; // keep
        }
      );

      return true; // keep this top-level reply
    });

    if (!modified) {
      return Response.json(
        { success: false, message: "Not authorized to delete this reply" },
        { status: 403 }
      );
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
      message: "Error while deleting reply",
      error,
    });
  }
}
