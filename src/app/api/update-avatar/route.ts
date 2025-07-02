import { NextResponse } from "next/server";
import UserModel from "@/model/user";
import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/option";
import { uploadAvatar } from "@/helpers/cloudinaryHelper";

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

    if (!avatarUrl) {
      return NextResponse.json(
        { error: "Avatar URL is required" },
        { status: 400 }
      );
    }

    // Upload new avatar to Cloudinary using the helper function
    const uploadResult = await uploadAvatar(avatarUrl, session.user.email);

    if (!uploadResult.success || !uploadResult.url) {
      return NextResponse.json(
        { error: `Failed to upload avatar: ${uploadResult.error}` },
        { status: 500 }
      );
    }

    // Update user with new avatar URL and options
    const userId = session?.user?._id;
    await UserModel.findByIdAndUpdate(userId, {
      image: uploadResult.url,
      avatarOptions: avatarOptions,
    });

    return NextResponse.json({
      success: true,
      imageUrl: uploadResult.url,
    });
  } catch (error) {
    console.error("Avatar update error:", error);
    return NextResponse.json(
      { error: "Failed to update avatar" },
      { status: 500 }
    );
  }
}