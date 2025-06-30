import dbConnect from "@/lib/dbConnect";
import ThoughtModel from "@/model/thoughts";
import UserModel from "@/model/user";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/option";
import cloudinary from "@/lib/cloudinary";

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
    const imageFile = formData
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

    if (imageFile.length > 0) {
      for (const file of imageFile) {
        try {
          const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
          ];
          if (!allowedTypes.includes(file.type)) {
            return Response.json(
              {
                success: false,
                message:
                  "Invalid file type. Only JPEG, PNG, and WEBP are allowed.",
              },
              { status: 400 }
            );
          }

          if (file.size > 5 * 1024 * 1024) {
            return Response.json(
              {
                success: false,
                message: "One of the files is too large. Max size is 5MB.",
              },
              { status: 400 }
            );
          }

          const buffer = await file.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          const dataUri = `data:${file.type};base64,${base64}`;

          const uploadResult = await cloudinary.uploader.upload(dataUri, {
            folder: "thoughts",
            transformation: [{ width: 800, height: 600, crop: "limit" }],
          });

          uploadedImageUrls.push(uploadResult.secure_url);
        } catch (err) {
          console.error("Error uploading file:", err);
          return Response.json(
            { success: false, message: "Error uploading image file." },
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

