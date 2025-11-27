import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/user";
import UserMatch from "@/model/userMatch";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/option";
import { NextResponse } from "next/server";
import MessageRequest from "@/model/messageRequest";



// app/api/user-match/route.ts
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
    
    // Enhanced gender validation
    const userGender = currentUser.gender?.toLowerCase().trim();
    if (!userGender || (userGender !== 'male' && userGender !== 'female')) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid gender setting. Please set your gender to male or female to find matches.",
        },
        { status: 400 }
      );
    }

    const oppositeGender = userGender === "male" ? "female" : "male";

    console.log("=== MATCHING DEBUG ===");
    console.log("Current User:", {
      id: currentUserId.toString(),
      username: currentUser.username,
      gender: userGender,
      oppositeGenderLookingFor: oppositeGender
    });

    // Find already matched users
    const existingMatches = await UserMatch.find({
      $or: [{ user1: currentUserId }, { user2: currentUserId }],
    });

    const matchedUserIds = existingMatches.flatMap((m) => [
      m.user1.toString(),
      m.user2.toString(),
    ]);

    console.log("Already matched with:", matchedUserIds.length, "users");

    // Enhanced candidate search with strict gender validation
    const candidates = await UserModel.find({
      $and: [
        { 
          $or: [
            { gender: oppositeGender },
            { gender: oppositeGender.charAt(0).toUpperCase() + oppositeGender.slice(1) }
          ]
        },
        { _id: { $nin: [...matchedUserIds, currentUserId] } },
        { isVerified: true } // Only match with verified users
      ]
    });

    console.log("Available candidates:", candidates.length);
    console.log("Candidate details:", candidates.map(c => ({
      id: c._id.toString(),
      username: c.username,
      anonymousName: c.anonymousName,
      gender: c.gender,
      isVerified: c.isVerified
    })));

    if (candidates.length === 0) {
      let message = "No new matches available. Try again later!";
      
      // Check why no candidates are available
      const allOppositeGenderUsers = await UserModel.find({
        $or: [
          { gender: oppositeGender },
          { gender: oppositeGender.charAt(0).toUpperCase() + oppositeGender.slice(1) }
        ],
        isVerified: true
      });
      
      console.log("All opposite gender users:", allOppositeGenderUsers.length);
      
      if (allOppositeGenderUsers.length === 0) {
        message = `No ${oppositeGender} users available in the system.`;
      } else if (allOppositeGenderUsers.length === matchedUserIds.length) {
        message = `You've already matched with all available ${oppositeGender} users.`;
      }
      
      return NextResponse.json(
        {
          success: false,
          message,
          debug: {
            totalOppositeGender: allOppositeGenderUsers.length,
            alreadyMatched: matchedUserIds.length,
            currentUserGender: userGender,
            lookingFor: oppositeGender
          }
        },
        { status: 200 }
      );
    }

    // Random match
    const matchedUser = candidates[Math.floor(Math.random() * candidates.length)];
    
    // Final gender validation check
    const matchedUserGender = matchedUser.gender?.toLowerCase().trim();
    if (matchedUserGender !== oppositeGender) {
      console.error("GENDER MISMATCH ERROR:", {
        expected: oppositeGender,
        actual: matchedUserGender,
        matchedUser: matchedUser.username
      });
      return NextResponse.json(
        {
          success: false,
          message: "Gender matching error. Please try again.",
        },
        { status: 500 }
      );
    }
    
    console.log("Matched User:", {
      id: matchedUser._id.toString(),
      username: matchedUser.username,
      anonymousName: matchedUser.anonymousName,
      gender: matchedUser.gender,
      verified: matchedUser.isVerified
    });

    // Check if match already exists (Double check)
    const existingMatch = await UserMatch.findOne({
      $or: [
        { user1: currentUserId, user2: matchedUser._id },
        { user1: matchedUser._id, user2: currentUserId },
      ],
    });

    if (existingMatch) {
      console.log("Match already exists!");
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

    console.log("Match created:", match._id.toString());

    // Check if message request already exists
    const existingRequest = await MessageRequest.findOne({
      $or: [
        { sender: currentUserId, recipient: matchedUser._id },
        { sender: matchedUser._id, recipient: currentUserId }
      ]
    });

    if (existingRequest) {
      console.log("Message request already exists!");
      // Delete the match we just created since request exists
      await UserMatch.findByIdAndDelete(match._id);
      return NextResponse.json(
        {
          success: false,
          message: "Message request already exists",
        },
        { status: 400 }
      );
    }

    // Create message request
    const messageRequest = await MessageRequest.create({
      sender: currentUserId,
      recipient: matchedUser._id,
      status: "pending",
      relatedMatch: match._id,
    });

    console.log("Message Request created:", {
      _id: messageRequest._id.toString(),
      sender: messageRequest.sender.toString(),
      recipient: messageRequest.recipient.toString(),
      status: messageRequest.status
    });

    // Verify and populate the request with user details
    const verifyRequest = await MessageRequest.findById(messageRequest._id)
      .populate("sender", "username anonymousName image email gender")
      .populate("recipient", "username anonymousName image email gender");

    console.log("Verified Message Request:", {
      _id: verifyRequest._id.toString(),
      sender: {
        id: verifyRequest.sender?._id.toString(),
        name: verifyRequest.sender?.anonymousName,
        gender: verifyRequest.sender?.gender
      },
      recipient: {
        id: verifyRequest.recipient?._id.toString(),
        name: verifyRequest.recipient?.anonymousName,
        gender: verifyRequest.recipient?.gender
      },
      status: verifyRequest.status
    });

    // Final validation: Ensure genders are opposite in the populated data
    const senderGender = verifyRequest.sender?.gender?.toLowerCase().trim();
    const recipientGender = verifyRequest.recipient?.gender?.toLowerCase().trim();
    
    if (senderGender === recipientGender) {
      console.error("CRITICAL GENDER VALIDATION FAILED:", {
        senderGender,
        recipientGender,
        matchId: match._id.toString()
      });
      
      // Rollback: Delete both match and message request
      await UserMatch.findByIdAndDelete(match._id);
      await MessageRequest.findByIdAndDelete(messageRequest._id);
      
      return NextResponse.json(
        {
          success: false,
          message: "Gender validation failed. Please try again.",
        },
        { status: 500 }
      );
    }

    // Populate match with user details for response
    const populatedMatch = await UserMatch.findById(match._id)
      .populate("user1", "username anonymousName image email gender")
      .populate("user2", "username anonymousName image email gender");

    console.log("=== MATCHING SUCCESS ===");
    console.log("Gender Validation:", {
      user1: {
        name: populatedMatch.user1.anonymousName,
        gender: populatedMatch.user1.gender
      },
      user2: {
        name: populatedMatch.user2.anonymousName,
        gender: populatedMatch.user2.gender
      },
      oppositeGenders: senderGender !== recipientGender
    });
    console.log("=== END MATCHING DEBUG ===\n");

    return NextResponse.json({
      success: true,
      message: "Match created and message request sent successfully!",
      data: {
        match: populatedMatch,
        messageRequest: verifyRequest,
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

    const allMatches = await UserMatch.find({
      $or: [{ user1: currentUserId }, { user2: currentUserId }],
    })
      .populate([
        {
          path: "user1",
          select: "username anonymousName image _id gender",
        },
        {
          path: "user2",
          select: "username anonymousName image _id gender",
        },
      ])
      .sort({ createdAt: -1 });

    // Enhanced filtering with gender validation
    const pendingReceivedRequests = allMatches.filter((match) => {
      const isPending = match.status === "pending";
      const isRecipient = match.user2._id.toString() === currentUserId.toString();
      
      // Additional gender validation
      const user1Gender = match.user1.gender?.toLowerCase().trim();
      const user2Gender = match.user2.gender?.toLowerCase().trim();
      const validGenders = user1Gender && user2Gender && user1Gender !== user2Gender;
      
      return isPending && isRecipient && validGenders;
    });

    const pendingSentRequests = allMatches.filter((match) => {
      const isPending = match.status === "pending";
      const isSender = match.user1._id.toString() === currentUserId.toString();
      
      // Additional gender validation
      const user1Gender = match.user1.gender?.toLowerCase().trim();
      const user2Gender = match.user2.gender?.toLowerCase().trim();
      const validGenders = user1Gender && user2Gender && user1Gender !== user2Gender;
      
      return isPending && isSender && validGenders;
    });

    const acceptedMatches = allMatches.filter((match) => {
      const isAccepted = match.status === "accepted";
      
      // Additional gender validation
      const user1Gender = match.user1.gender?.toLowerCase().trim();
      const user2Gender = match.user2.gender?.toLowerCase().trim();
      const validGenders = user1Gender && user2Gender && user1Gender !== user2Gender;
      
      return isAccepted && validGenders;
    });

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
