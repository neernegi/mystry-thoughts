import { z } from "zod";

export const verifySchema = z.object({
  username:z.string().min(1, "Username is required"),
  code: z.string().length(6, { message: "Code must be 6 characters long" }),
});
