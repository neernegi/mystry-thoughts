import { NextResponse } from "next/server";
import UserModel from "@/model/user";
import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/option";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME!,
  api_key: process.env.CLOUD_API_KEY!,
  api_secret: process.env.CLOUD_API_SECRET!,
});

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
    const { avatarOptions, avatarUrl } = await req.json();

    // Upload new avatar to Cloudinary
    const result = await cloudinary.uploader.upload(avatarUrl, {
      folder: "avatars",
    });

    const userId = session?.user?._id;
    await UserModel.findByIdAndUpdate(userId, {
      image: result.secure_url,
      avatarOptions: avatarOptions
    });

    return NextResponse.json({
      success: true,
      imageUrl: result.secure_url,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update avatar" },
      { status: 500 }
    );
  }
}
