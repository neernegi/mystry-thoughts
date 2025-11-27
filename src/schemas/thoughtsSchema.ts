import { z } from "zod";
import mongoose from "mongoose";

export const AddReplySchema = z.object({
  thoughtId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid thought ID",
  }),
  reply: z.string().min(1, "Reply cannot be empty").max(300, "Reply too long"),
});

export type AddReplyInput = z.infer<typeof AddReplySchema>;