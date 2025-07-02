import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/option";
import MessageRequest from "@/model/messageRequest";
import Chat from "@/model/Chat";



/*

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
    const userId = session?.user?._id;
    const requests = await MessageRequest.find({
      $or: [{ sender: userId }, { recipient: userId }],
    })
      .populate("sender", "username anonymousName image")
      .populate("recipient", "username anonymousName image")
      .sort({ createdAt: -1 });

    return Response.json({
      success: true,
      message: "message request fetched successfully",
      requests,
    });
  } catch (error) {
    console.log(error, "error while fetching message request");
  }
}


*/



// Update your GET route in app/api/messageRequest/route.ts
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
    const userId = session?.user?._id;
    const requests = await MessageRequest.find({
      $or: [{ sender: userId }, { recipient: userId }],
    })
      .populate("sender", "username anonymousName image")
      .populate("recipient", "username anonymousName image")
      .sort({ createdAt: -1 });

    // Fetch last messages for accepted chats
    const requestsWithLastMessages = await Promise.all(
      requests.map(async (request) => {
        if (request.status === 'accepted' && request.relatedMatch) {
          const lastMessage = await Chat.findOne(
            { _id: request.relatedMatch },
            { messages: { $slice: -1 } }
          )
          .populate('messages.sender', 'username anonymousName image')
          .then(chat => chat?.messages[0] || null);
          
          return {
            ...request.toObject(),
            lastMessage: lastMessage ? {
              content: lastMessage.content,
              timestamp: lastMessage.timestamp,
              sender: lastMessage.sender
            } : null
          };
        }
        return request;
      })
    );

    return Response.json({
      success: true,
      message: "message request fetched successfully",
      requests: requestsWithLastMessages,
    });
  } catch (error) {
    console.log(error, "error while fetching message request");
    return Response.json(
      { success: false, message: "Error fetching message requests" },
      { status: 500 }
    );
  }
}