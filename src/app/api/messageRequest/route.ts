import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/option";
import MessageRequest from "@/model/messageRequest";
import UserModel from "@/model/user";


export async function GET(req: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);

  console.log("=== COMPLETE DEBUG ===");
  console.log("Session user ID:", session?.user?._id);
  console.log("Session user email:", session?.user?.email);

  if (!session || !session.user?.email) {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const currentUser = await UserModel.findOne({ email: session.user.email });
    
    if (!currentUser) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const currentUserId = currentUser._id;

    console.log("Current user from DB ID:", currentUserId.toString());
    console.log("Current user email:", currentUser.email);

    // Get ALL message requests without filtering first
    const allRequestsInDB = await MessageRequest.find({})
      .populate("sender", "username anonymousName image email _id")
      .populate("recipient", "username anonymousName image email _id")
      .sort({ createdAt: -1 });

    console.log("=== ALL REQUESTS IN DATABASE ===");
    allRequestsInDB.forEach((req, index) => {
      console.log(`Request ${index + 1}:`, {
        requestId: req._id.toString(),
        senderId: req.sender?._id?.toString(),
        senderName: req.sender?.anonymousName,
        recipientId: req.recipient?._id?.toString(),
        recipientName: req.recipient?.anonymousName,
        status: req.status
      });
    });

    // Now filter for current user
    const userRequests = await MessageRequest.find({
      $or: [{ sender: currentUserId }, { recipient: currentUserId }],
    })
      .populate("sender", "username anonymousName image email _id")
      .populate("recipient", "username anonymousName image email _id")
      .sort({ createdAt: -1 });

    console.log("=== REQUESTS FOR CURRENT USER ===");
    console.log("Filtered requests found:", userRequests.length);
    
    userRequests.forEach((req, index) => {
      console.log(`User Request ${index + 1}:`, {
        requestId: req._id.toString(),
        senderId: req.sender?._id?.toString(),
        senderName: req.sender?.anonymousName,
        recipientId: req.recipient?._id?.toString(),
        recipientName: req.recipient?.anonymousName,
        status: req.status,
        isSender: req.sender?._id?.toString() === currentUserId.toString(),
        isRecipient: req.recipient?._id?.toString() === currentUserId.toString()
      });
    });

    // Separate requests
    const sentRequests = [];
    const receivedRequests = [];

    for (const req of userRequests) {
      const requestData = {
        _id: req._id.toString(),
        sender: req.sender,
        recipient: req.recipient,
        status: req.status,
        relatedMatch: req.relatedMatch,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt
      };

      if (req.sender?._id?.toString() === currentUserId.toString()) {
        console.log(`→ SENT: ${req.sender?.anonymousName} → ${req.recipient?.anonymousName}`);
        sentRequests.push(requestData);
      } else if (req.recipient?._id?.toString() === currentUserId.toString()) {
        console.log(`→ RECEIVED: ${req.sender?.anonymousName} → ${req.recipient?.anonymousName}`);
        receivedRequests.push(requestData);
      }
    }

    console.log("=== FINAL COUNTS ===");
    console.log("Sent requests:", sentRequests.length);
    console.log("Received requests:", receivedRequests.length);
    console.log("=== END DEBUG ===\n");

    return Response.json({
      success: true,
      message: "Message requests fetched successfully",
      requests: userRequests, // All requests for this user
      data: {
        allRequests: userRequests,
        sentRequests: sentRequests,
        receivedRequests: receivedRequests,
        counts: {
          sent: sentRequests.length,
          received: receivedRequests.length,
          total: userRequests.length
        }
      },
    });
  } catch (error) {
    console.log("Error while fetching message request:", error);
    return Response.json(
      { success: false, message: "Error fetching message requests" },
      { status: 500 }
    );
  }
}

