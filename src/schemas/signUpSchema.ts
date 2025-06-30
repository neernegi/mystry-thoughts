import { z } from "zod";

// Username validation schema
export const usernameValidation = z
  .string()
  .min(2, { message: "Username must be at least 2 characters" })
  .max(20, { message: "Username must be at most 20 characters" })
  .regex(/^[a-zA-Z0-9_]+$/, {
    message: "Username can only contain letters, numbers, and underscores",
  });

// Sign-up schema
export const signUpSchema = z.object({
  username: usernameValidation,
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
  gender: z.enum(["male", "female"], {
    message: "Gender must be either 'male' or 'female'",
  }),
  
});
