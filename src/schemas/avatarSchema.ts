import { z } from 'zod';

// Zod schema for validation
export const AvatarZodSchema = z.object({
  user: z.string(),
  avatarStyle: z.enum(['Circle', 'Transparent']),
  topType: z.string(),
  accessoriesType: z.string(),
  hatColor: z.string().optional(),
  facialHairType: z.string(),
  facialHairColor: z.string(),
  clotheType: z.string(),
  eyeType: z.string(),
  eyebrowType: z.string(),
  mouthType: z.string(),
  skinColor: z.string(),
  cloudinaryUrl: z.string(),
});