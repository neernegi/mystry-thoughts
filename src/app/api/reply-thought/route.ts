import dbConnect from "@/lib/dbConnect";
import ThoughtModel from "@/model/thoughts";
import UserModel from "@/model/user";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/option";

export async function POST(req: Request) {
  if (req.method !== "POST") {
    return Response.json(
      { success: false, message: "Method not allowed" },
      { status: 405 }
    );
  }
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }
  const { thoughtId, reply } = await req.json();

  
  try {

    if (!thoughtId || !reply?.trim()) {
    return Response.json(
      { success: false, message: "Thought Id and reply are required" },
      { status: 400 }
    );
  }

    const user = await UserModel.findOne({ email: session?.user?.email });
    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
    const thought = await ThoughtModel.findById(thoughtId);
    if (!thought) {
      return Response.json(
        { success: false, message: "Thought not found" },
        { status: 404 }
      );
    }

    const replyThought = {
      user: user._id,
      text: reply,
      createdAt: new Date(),
    };

    thought.replies.push(replyThought);
    await thought.save();

    return Response.json(
      {
        success: true,
        message: "Reply added successfully",
        data: replyThought,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding reply:", error);
    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}










/*





// ===================================
// 1. VALIDATION SCHEMAS (lib/validations/thoughtValidation.ts)
// ===================================

import { z } from "zod";
import mongoose from "mongoose";

// Input validation for creating a new thought
export const CreateThoughtSchema = z.object({
  thought: z
    .string()
    .min(1, "Thought cannot be empty")
    .max(500, "Thought must be less than 500 characters")
    .trim(), // Remove whitespace
  images: z
    .array(z.string())
    .max(4, "Maximum 4 images allowed")
    .optional()
    .default([]),
});

// Input validation for adding a reply
export const AddReplySchema = z.object({
  thoughtId: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid thought ID format",
    }),
  reply: z
    .string()
    .min(1, "Reply cannot be empty")
    .max(300, "Reply must be less than 300 characters")
    .trim(),
  parentReplyId: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid parent reply ID format",
    })
    .optional(), // Optional for top-level replies
});

// Input validation for getting thoughts with pagination
export const GetThoughtsSchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, "Page must be greater than 0")
    .default("1"),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 50, "Limit must be between 1 and 50")
    .default("10"),
});

// Type exports for use in your components/pages
export type CreateThoughtInput = z.infer<typeof CreateThoughtSchema>;
export type AddReplyInput = z.infer<typeof AddReplySchema>;
export type GetThoughtsInput = z.infer<typeof GetThoughtsSchema>;

// ===================================
// 2. UTILITY FUNCTIONS FOR ERROR HANDLING (lib/utils/validation.ts)
// ===================================

import { ZodError } from "zod";
import { NextResponse } from "next/server";

// Helper function to handle Zod validation errors
export function handleValidationError(error: ZodError) {
  const errorMessages = error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));

  return NextResponse.json(
    {
      success: false,
      message: "Validation failed",
      errors: errorMessages,
    },
    { status: 400 }
  );
}

// Generic validation wrapper
export async function validateRequestBody<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const body = await req.json();
    const validatedData = schema.parse(body);
    return { data: validatedData, error: null };
  } catch (error) {
    if (error instanceof ZodError) {
      return { data: null, error: handleValidationError(error) };
    }
    return {
      data: null,
      error: NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      ),
    };
  }
}

// ===================================
// 3. UPDATED API ROUTE - CREATE THOUGHT (app/api/thoughts/route.ts)
// ===================================

import dbConnect from "@/lib/dbConnect";
import ThoughtModel from "@/model/thoughts";
import UserModel from "@/model/user";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/option";
import { uploadImageToCloudinary } from "@/helpers/uploadImageToCloudinary";
import { CreateThoughtSchema } from "@/lib/validations/thoughtValidation";
import { validateRequestBody } from "@/lib/utils/validation";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  await dbConnect();

  // 1. CHECK AUTHENTICATION
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  // 2. VALIDATE REQUEST BODY
  const { data: validatedData, error } = await validateRequestBody(
    req,
    CreateThoughtSchema
  );

  if (error) {
    return error; // Return validation error response
  }

  try {
    // 3. FIND USER
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // 4. UPLOAD IMAGES (if any)
    const uploadedImageUrls: string[] = [];
    
    if (validatedData.images && validatedData.images.length > 0) {
      for (const image of validatedData.images) {
        try {
          const uploaded = await uploadImageToCloudinary(image, "thoughts");
          if (uploaded && typeof uploaded === "object" && "secure_url" in uploaded) {
            uploadedImageUrls.push(uploaded.secure_url as string);
          }
        } catch (err) {
          console.error("Error uploading image:", err);
          // Continue with other images even if one fails
        }
      }
    }

    // 5. CREATE THOUGHT
    const newThought = await ThoughtModel.create({
      user: user._id,
      thought: validatedData.thought, // Using validated data
      image: uploadedImageUrls,
      replies: [],
    });

    // 6. POPULATE USER INFO BEFORE RETURNING
    await newThought.populate('user', 'username email');

    return NextResponse.json(
      {
        success: true,
        message: "Thought posted successfully",
        data: newThought,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error posting thought:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// GET THOUGHTS WITH PAGINATION
export async function GET(req: Request) {
  await dbConnect();

  try {
    // 1. VALIDATE QUERY PARAMETERS
    const { searchParams } = new URL(req.url);
    const queryData = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
    };

    const validatedQuery = GetThoughtsSchema.parse(queryData);

    // 2. CALCULATE PAGINATION
    const skip = (validatedQuery.page - 1) * validatedQuery.limit;

    // 3. FETCH THOUGHTS
    const thoughts = await ThoughtModel.find()
      .populate('user', 'username email')
      .populate('replies.user', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(validatedQuery.limit);

    const totalThoughts = await ThoughtModel.countDocuments();
    const totalPages = Math.ceil(totalThoughts / validatedQuery.limit);

    return NextResponse.json({
      success: true,
      data: {
        thoughts,
        pagination: {
          currentPage: validatedQuery.page,
          totalPages,
          totalThoughts,
          hasNext: validatedQuery.page < totalPages,
          hasPrev: validatedQuery.page > 1,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleValidationError(error);
    }
    
    console.error("Error fetching thoughts:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// ===================================
// 4. REPLY API ROUTE (app/api/thoughts/[thoughtId]/replies/route.ts)
// ===================================

import dbConnect from "@/lib/dbConnect";
import ThoughtModel from "@/model/thoughts";
import UserModel from "@/model/user";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";
import { AddReplySchema } from "@/lib/validations/thoughtValidation";
import { validateRequestBody } from "@/lib/utils/validation";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function POST(
  req: Request,
  { params }: { params: { thoughtId: string } }
) {
  await dbConnect();

  // 1. CHECK AUTHENTICATION
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  // 2. VALIDATE REQUEST BODY
  const { data: validatedData, error } = await validateRequestBody(
    req,
    AddReplySchema
  );

  if (error) {
    return error;
  }

  // 3. VALIDATE THOUGHT ID FROM URL
  if (!mongoose.Types.ObjectId.isValid(params.thoughtId)) {
    return NextResponse.json(
      { success: false, message: "Invalid thought ID" },
      { status: 400 }
    );
  }

  try {
    // 4. FIND USER
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // 5. FIND THOUGHT
    const thought = await ThoughtModel.findById(params.thoughtId);
    if (!thought) {
      return NextResponse.json(
        { success: false, message: "Thought not found" },
        { status: 404 }
      );
    }

    // 6. CREATE REPLY OBJECT
    const newReply = {
      _id: new mongoose.Types.ObjectId(),
      user: user._id,
      reply: validatedData.reply,
      replies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 7. ADD REPLY (nested or top-level)
    if (validatedData.parentReplyId) {
      // This is a nested reply - find parent and add to its replies array
      const findAndAddNestedReply = (replies: any[], parentId: string): boolean => {
        for (const reply of replies) {
          if (reply._id.toString() === parentId) {
            reply.replies.push(newReply);
            return true;
          }
          if (reply.replies && reply.replies.length > 0) {
            if (findAndAddNestedReply(reply.replies, parentId)) {
              return true;
            }
          }
        }
        return false;
      };

      const found = findAndAddNestedReply(thought.replies, validatedData.parentReplyId);
      if (!found) {
        return NextResponse.json(
          { success: false, message: "Parent reply not found" },
          { status: 404 }
        );
      }
    } else {
      // This is a top-level reply
      thought.replies.push(newReply);
    }

    // 8. SAVE THOUGHT
    await thought.save();

    // 9. POPULATE AND RETURN
    await thought.populate('user', 'username email');
    await thought.populate('replies.user', 'username email');

    return NextResponse.json(
      {
        success: true,
        message: "Reply added successfully",
        data: thought,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding reply:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

// ===================================
// 5. FRONTEND USAGE EXAMPLES
// ===================================

// In your React component (components/CreateThought.tsx):
import { useState } from 'react';
import { CreateThoughtInput } from '@/lib/validations/thoughtValidation';

export default function CreateThought() {
  const [formData, setFormData] = useState<CreateThoughtInput>({
    thought: '',
    images: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/thoughts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!result.success) {
        if (result.errors) {
          // Handle validation errors
          const errorMap: Record<string, string> = {};
          result.errors.forEach((err: any) => {
            errorMap[err.field] = err.message;
          });
          setErrors(errorMap);
        } else {
          alert(result.message);
        }
        return;
      }

      // Success!
      alert('Thought posted successfully!');
      setFormData({ thought: '', images: [] });
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <textarea
          value={formData.thought}
          onChange={(e) => setFormData({ ...formData, thought: e.target.value })}
          placeholder="What's on your mind?"
          rows={4}
        />
        {errors.thought && <p className="error">{errors.thought}</p>}
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Posting...' : 'Post Thought'}
      </button>
    </form>
  );
}



*/