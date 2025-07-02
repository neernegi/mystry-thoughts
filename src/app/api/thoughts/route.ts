import dbConnect from "@/lib/dbConnect";
import ThoughtModel from "@/model/thoughts";
import UserModel from "@/model/user";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/option";
import {
  uploadThoughtImage,
  fileToBase64,
  validateImageFile,
} from "@/helpers/cloudinaryHelper";




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
    const formData = await req.formData();
    const thought = formData.get("thought") as string;
    const imageFiles = formData
      .getAll("image")
      .filter((item) => item instanceof File) as File[];

    if (!thought || thought.trim() === "") {
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

    let uploadedImageUrls: string[] = [];

    if (imageFiles.length > 0) {
      for (const file of imageFiles) {
        // Validate file
        const validation = validateImageFile(file, 5);
        if (!validation.isValid) {
          return Response.json(
            {
              success: false,
              message: validation.error,
            },
            { status: 400 }
          );
        }

        try {
          // Convert file to base64
          const base64DataUri = await fileToBase64(file);

          // Upload to Cloudinary
          const uploadResult = await uploadThoughtImage(base64DataUri);

          if (uploadResult.success && uploadResult.url) {
            uploadedImageUrls.push(uploadResult.url);
          } else {
            console.error("Error uploading file:", uploadResult.error);
            return Response.json(
              { success: false, message: "Error uploading image file." },
              { status: 500 }
            );
          }
        } catch (err) {
          console.error("Error processing file:", err);
          return Response.json(
            { success: false, message: "Error processing image file." },
            { status: 500 }
          );
        }
      }
    }

    const newThought = await ThoughtModel.create({
      user: user._id,
      thought,
      image: uploadedImageUrls,
      replies: [],
    });

    return Response.json(
      {
        success: true,
        message: "Thought posted successfully",
        data: newThought,
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

  if (!session || !session.user?.email) {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const thoughts = await ThoughtModel.find()
      .populate({
        path: "user",
        select: "username anonymousName image",
      })
      .populate({
        path: "thoughtReplies.user",
        model: "User",
        select: "username anonymousName image",
      })
      .populate({
        path: "thoughtReplies.replyOfreplies.user",
        model: "User",
        select: "username anonymousName image",
      });
    return Response.json({
      success: true,
      message: "successfully fetched",
      data: thoughts,
    });
  } catch (error) {
    console.log(error);
    return Response.json(
      {
        success: false,
        message: "An error occurred while fetching confessions.",
        error: error,
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { thoughtId, thought } = await req.json();

    if (!thoughtId || !thought) {
      return Response.json(
        { success: false, message: "Thought ID and content are required" },
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

    const findthought = await ThoughtModel.findById(thoughtId);
    if (!findthought) {
      return Response.json(
        { success: false, message: "Thought not found" },
        { status: 404 }
      );
    }

    const isOwner = findthought.user.toString() === user._id.toString();
    if (!isOwner) {
      return Response.json(
        { success: false, message: "Only the thought owner can update it" },
        { status: 403 }
      );
    }

    findthought.thought = thought;
    await findthought.save();

    return Response.json(
      {
        success: true,
        message: "Thought updated successfully",
        data: findthought,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating thought:", error);
    return Response.json(
      { success: false, message: "Server error during update" },
      { status: 500 }
    );
  }
}
