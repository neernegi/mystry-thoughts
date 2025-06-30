// app/api/socket-token/route.ts
import { getToken } from "next-auth/jwt";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json({ 
      socketToken: token 
    });
  } catch (error) {
    console.error("Socket token error:", error);
    return NextResponse.json(
      { error: "Failed to generate socket token" },
      { status: 500 }
    );
  }
}