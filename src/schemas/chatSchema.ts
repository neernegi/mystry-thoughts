import { z } from "zod";
import mongoose from "mongoose";

// Zod schema for ChatRoom input validation
export const zodChatRoomSchema = z.object({
  participants: z
    .array(
      z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid user ObjectId",
      })
    )
    .length(2, { message: "Exactly two participants are required" }),

  match: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid match ObjectId",
    }),
});
