import mongoose from "mongoose";
import { z } from "zod";

export const ReplyToConfessionSchema = z.object({
  replyConfession: z.string().min(1, "Reply cannot be empty"),
});

export const confessionSchema = z.object({
  user: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid user objectId",
  }),
  confession: z.string().min(4, "Confession cannot be empty"),
  repliesToConfession: z.array(ReplyToConfessionSchema).optional(),
});

export type IReply = z.infer<typeof ReplyToConfessionSchema>;
export type IConfession = z.infer<typeof confessionSchema>;
