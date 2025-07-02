import mongoose, { Document, Schema, Types } from "mongoose";

export interface AvatarOptions {
  avatarStyle?: string;
  topType?: string;
  accessoriesType?: string;
  hairColor?: string;
  facialHairType?: string;
  facialHairColor?: string;
  clotheType?: string;
  colorFabric?: string;
  eyeType?: string;
  eyebrowType?: string;
  mouthType?: string;
  skinColor?: string;
}

export interface User extends Document {
  _id: Types.ObjectId;
  username: string;
  password: string;
  email: string;
  anonymousName: string;
  image: string;
  gender: "male" | "female";
  verifyCode: string;
  verifyCodeExpiry: Date;
  isOnline: boolean;
  isSearching: boolean;
  socketId?: string;
  isVerified: boolean;
  avatarOptions?: AvatarOptions;
 
  createdAt: Date;
}

// Create a separate schema for AvatarOptions with Mixed type fallback
const AvatarOptionsSchema = new Schema({
  avatarStyle: { type: String, default: "" },
  topType: { type: String, default: "" },
  accessoriesType: { type: String, default: "" },
  hairColor: { type: String, default: "" },
  facialHairType: { type: String, default: "" },
  facialHairColor: { type: String, default: "" },
  clotheType: { type: String, default: "" },
  colorFabric: { type: String, default: "" },
  eyeType: { type: String, default: "" },
  eyebrowType: { type: String, default: "" },
  mouthType: { type: String, default: "" },
  skinColor: { type: String, default: "" },
}, { _id: false, strict: false });

const UserSchema: Schema<User> = new Schema({
  username: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Please fill a valid email address",
    ],
  },
  anonymousName: {
    type: String,
    default: "Anonymous",
  },
  image: {
    type: String,
  },
  password: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    enum: ["male", "female"],
    required: true,
  },
  verifyCode: {
    type: String,
    required: true,
  },
  verifyCodeExpiry: {
    type: Date,
    required: true,
  },
  isOnline: { type: Boolean, default: false },
  isSearching: { type: Boolean, default: false },
  socketId: { type: String },
  isVerified: {
    type: Boolean,
    default: false,
  },
  // Use Mixed type as a more reliable alternative
  avatarOptions: {
    type: Schema.Types.Mixed,
    default: {}
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const UserModel =
  (mongoose.models.User as mongoose.Model<User>) ||
  mongoose.model<User>("User", UserSchema);

export default UserModel;