// ✅ app/api/match/route.ts

import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/user";
// import Message from "@/model/message";
import UserMatch from "@/model/userMatch";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/option";
// import { notifyNewMatch } from "@/socket/socket";
import { Types } from "mongoose";
import { NextResponse } from "next/server";
import MessageRequest from "@/model/messageRequest";

export async function POST(req: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const currentUser = await UserModel.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const currentUserId = currentUser._id;
    const oppositeGender = currentUser.gender === "male" ? "female" : "male";

    // Find already matched users
    const existingMatches = await UserMatch.find({
      $or: [{ user1: currentUserId }, { user2: currentUserId }],
    });

    const matchedUserIds = existingMatches.flatMap((m) => [
      m.user1.toString(),
      m.user2.toString(),
    ]);

    // Find candidates (opposite gender, not already matched, not current user)
    const candidates = await UserModel.find({
      gender: oppositeGender,
      _id: { $nin: [...matchedUserIds, currentUserId] },
      acceptMessages: true,
    });

    if (candidates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No new matches available. Try again later!",
        },
        { status: 404 }
      );
    }

    // Random match
    const matchedUser =
      candidates[Math.floor(Math.random() * candidates.length)];

    // Check if match already exists in either direction
    const existingMatch = await UserMatch.findOne({
      $or: [
        { user1: currentUserId, user2: matchedUser._id },
        { user1: matchedUser._id, user2: currentUserId },
      ],
    });

    if (existingMatch) {
      return NextResponse.json(
        {
          success: false,
          message: "Match already exists",
        },
        { status: 400 }
      );
    }

    // Create new match with pending status
    const match = await UserMatch.create({
      user1: currentUserId,
      user2: matchedUser._id,
      status: "pending",
    });

    // Create message request from current user to matched user
    const existingRequest = await MessageRequest.findOne({
      sender: currentUserId,
      recipient: matchedUser._id,
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          success: false,
          message: "Message request already sent",
        },
        { status: 400 }
      );
    }

    const messageRequest = await MessageRequest.create({
      sender: currentUserId,
      recipient: matchedUser._id,
      status: "pending",
      relatedMatch: match._id,
    });

    // Populate match with user details
    const populatedMatch = await UserMatch.findById(match._id).populate([
      { path: "user1", select: "username anonymousName image _id" },
      { path: "user2", select: "username anonymousName image _id" },
    ]);

    return NextResponse.json({
      success: true,
      message: "Match created and message request sent successfully!",
      data: {
        match: populatedMatch,
        messageRequest,
      },
    });
  } catch (error) {
    console.error("Matching error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error while creating match. Please try again.",
      },
      { status: 500 }
    );
  }
}

// app/api/user-match/route.ts

export async function GET(req: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const currentUser = await UserModel.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const currentUserId = currentUser._id;

    // Get all matches involving current user
    const allMatches = await UserMatch.find({
      $or: [{ user1: currentUserId }, { user2: currentUserId }],
    })
      .populate([
        {
          path: "user1",
          select: "username anonymousName image _id",
        },
        {
          path: "user2",
          select: "username anonymousName image _id",
        },
      ])
      .sort({ createdAt: -1 });

    // Separate matches into categories
    const pendingReceivedRequests = allMatches.filter(
      (match) =>
        match.status === "pending" &&
        match.user2._id.toString() === currentUserId.toString()
    );

    const pendingSentRequests = allMatches.filter(
      (match) =>
        match.status === "pending" &&
        match.user1._id.toString() === currentUserId.toString()
    );

    const acceptedMatches = allMatches.filter(
      (match) => match.status === "accepted"
    );

    return NextResponse.json({
      success: true,
      message: "User matches retrieved successfully",
      data: {
        pendingReceivedRequests,
        pendingSentRequests,
        acceptedMatches,
        counts: {
          pendingReceived: pendingReceivedRequests.length,
          pendingSent: pendingSentRequests.length,
          accepted: acceptedMatches.length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user matches:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error while fetching matches. Please try again.",
      },
      { status: 500 }
    );
  }
}
