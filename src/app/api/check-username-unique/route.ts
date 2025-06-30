import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/user";
import { usernameValidation } from "@/schemas/signUpSchema";
import { z } from "zod";


export const UserNameQuerySchema = z.object({
  username: usernameValidation,
});



export async function GET(req: Request) {
  await dbConnect();

  try {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");

    if (!username) {
      return Response.json(
        {
          success: false,
          message: "Username is required.",
        },
        { status: 400 }
      );
    }

    const parsedData = UserNameQuerySchema.safeParse({ username });

    if (!parsedData.success) {
      return Response.json(
        {
          success: false,
          message: parsedData.error.errors[0].message,
        },
        { status: 400 }
      );
    }

    const existingUser = await UserModel.findOne({
      username,
      isVerified: true,
    });

    if (existingUser) {
      return Response.json(
        {
          success: false,
          message: "Username is already taken.",
        },
        { status: 400 }
      );
    }

    return Response.json(
      {
        success: true,
        message: "Username is available",
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "An error occurred while checking the username.",
      },
      { status: 500 }
    );
  }
}
