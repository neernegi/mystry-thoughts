import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/user";
import { verifySchema } from "@/schemas/verifySchema";
import { z } from "zod";

export async function POST(req: Request) {
  await dbConnect();

  try {
    const requestBody = await req.json();
    const parseData = verifySchema.safeParse(requestBody);

    if (!parseData.success) {
      return Response.json(
        {
          success: false,
          message: parseData.error.errors[0].message,
        },
        { status: 400 }
      );
    }
    const { username, code } = parseData.data;
    const decodedUsername = decodeURIComponent(username);
    const user = await UserModel.findOne({
      username: decodedUsername,
    });

    if (!user) {
      return Response.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    const isCodeValid = user.verifyCode === code;
    const isCodeNotExpired = new Date(user.verifyCodeExpiry) > new Date();

    if (isCodeNotExpired && isCodeValid) {
      user.isVerified = true;
      await user.save();

      return Response.json(
        {
          success: true,
          message: "User verified successfully",
        },
        { status: 200 }
      );
    } else if (!isCodeNotExpired) {
      return Response.json(
        {
          success: false,
          message: "Verification code has expired. Please sign up again.",
        },
        { status: 400 }
      );
    } else {
      return Response.json(
        {
          success: false,
          message: "Invalid verification code.",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in POST /api/verify-code:", error);
    return Response.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
