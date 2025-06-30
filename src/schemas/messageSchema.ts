import { z } from "zod";
import mongoose from "mongoose";

// Zod schema for Message input validation
export const zodMessageSchema = z.object({
  chatRoom: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ChatRoom ObjectId",
  }),

  sender: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid Sender ObjectId",
  }),

  message: z.string().optional().nullable(),
});
