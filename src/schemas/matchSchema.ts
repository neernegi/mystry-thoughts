import mongoose from "mongoose";
import { z } from "zod";



// Zod schema for Thought
export const ThoughtSchema = z.object({
  user1: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid user ObjectId",
  }),
  user2: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid user ObjectId",
  }),
});
