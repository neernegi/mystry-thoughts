// ===================================
// 2. ZOD VALIDATION SCHEMAS (schemas/thoughtsSchema.ts)
// ===================================

import { z } from "zod";
import mongoose from "mongoose";

// EXPLANATION: Recursive Reply Schema with z.lazy()
// z.lazy() allows self-referencing schemas (replies can have replies)
const ReplySchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    // Validate user as string that's a valid ObjectId
    user: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid user ObjectId",
    }),
    
    // Reply must be non-empty string
    reply: z.string().min(1, "Reply cannot be empty"),
    
    // Nested replies - optional array, defaults to empty
    replyOfreplies: z.array(ReplySchema).optional().default([]),
  })
);

// EXPLANATION: Thought Schema for database validation
const ThoughtSchema = z.object({
  // User must be valid ObjectId string
  user: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid user ObjectId",
  }),
  
  // Thought text - non-empty string
  thought: z.string().min(1, "Thought cannot be empty"),
  
  // Images - optional array of valid URLs, defaults to empty
  image: z.array(z.string().url("Invalid image URL")).optional().default([]),
  
  // Replies - optional array using ReplySchema, defaults to empty
  thoughtReplies: z.array(ReplySchema).optional().default([]),
});

// EXPLANATION: Input validation for creating thoughts
const CreateThoughtSchema = z.object({
  // Thought text: required, 1-500 characters
  thought: z.string()
    .min(1, "Thought cannot be empty")
    .max(500, "Thought too long"),
  
  // Images: optional array, max 4 items (base64 strings for upload)
  images: z.array(z.string())
    .max(4, "Maximum 4 images allowed")
    .optional(),
});

// EXPLANATION: Input validation for adding replies
const AddReplySchema = z.object({
  // Thought ID: must be valid ObjectId string
  thoughtId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid thought ID",
  }),
  
  // Reply text: required, 1-300 characters
  reply: z.string()
    .min(1, "Reply cannot be empty")
    .max(300, "Reply too long"),
  
  // Parent reply ID: optional (for nested replies), must be valid ObjectId if provided
  thoughtReplyId: z.string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid parent reply ID",
    })
    .optional(),
});

// EXPLANATION: Type exports
// These create TypeScript types from Zod schemas for use in components
type IReply = z.infer<typeof ReplySchema>;
type IThought = z.infer<typeof ThoughtSchema>;
type CreateThoughtInput = z.infer<typeof CreateThoughtSchema>;
type AddReplyInput = z.infer<typeof AddReplySchema>;

export { 
  ReplySchema, 
  ThoughtSchema, 
  CreateThoughtSchema,
  AddReplySchema,
  type IReply, 
  type IThought,
  type CreateThoughtInput,
  type AddReplyInput
};
