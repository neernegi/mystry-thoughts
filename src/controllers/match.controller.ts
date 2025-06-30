import ChatRoom from "@/model/chatRoom";
import UserModel from "@/model/user";
import UserMatch from "@/model/userMatch";


export const matchUser = async (userId: string) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new Error("User not found");

  const oppositeGender = user.gender === "male" ? "female" : "male";

  const existingMatches = await UserMatch.find({
    $or: [{ user1: userId }, { user2: userId }],
  });

  const alreadyMatchedIds = existingMatches.flatMap(m => [
    m.user1.toString(),
    m.user2.toString(),
  ]);

  const candidates = await UserModel.find({
    gender: oppositeGender,
    _id: { $nin: alreadyMatchedIds },
    acceptMessages: true,
  });

  if (candidates.length === 0) throw new Error("No opposite gender users left");

  const randomIndex = Math.floor(Math.random() * candidates.length);
  const matchedUser = candidates[randomIndex];

  const chatRoom = await ChatRoom.create({
    participants: [user._id, matchedUser._id],
  });

  const match = await UserMatch.create({
    user1: user._id,
    user2: matchedUser._id,
    chatRoom: chatRoom._id,
  });

  return { match, chatRoom };
};
