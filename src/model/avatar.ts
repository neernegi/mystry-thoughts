import mongoose, { Document, Schema, Types } from 'mongoose';
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

// TypeScript interface for Avatar (for Mongoose)
export interface IAvatar extends Document {
  user: Types.ObjectId;
  avatarStyle: 'Circle' | 'Transparent';
  topType: string;
  accessoriesType: string;
  hatColor?: string;
  facialHairType: string;
  facialHairColor: string;
  clotheType: string;
  eyeType: string;
  eyebrowType: string;
  mouthType: string;
  skinColor: string;
  cloudinaryUrl: string;
}

const AvatarSchema = new Schema<IAvatar>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  avatarStyle: { type: String, enum: ['Circle', 'Transparent'], required: true },
  topType: { type: String, required: true },
  accessoriesType: { type: String, required: true },
  hatColor: { type: String },
  facialHairType: { type: String, required: true },
  facialHairColor: { type: String, required: true },
  clotheType: { type: String, required: true },
  eyeType: { type: String, required: true },
  eyebrowType: { type: String, required: true },
  mouthType: { type: String, required: true },
  skinColor: { type: String, required: true },
  cloudinaryUrl: { type: String, required: true },
});

export const AvatarModel =
  mongoose.models.Avatar || mongoose.model<IAvatar>('Avatar', AvatarSchema);