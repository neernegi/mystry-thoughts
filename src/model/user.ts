import mongoose, { Document, Schema, Types } from "mongoose";

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
  isAcceptingConfessionReply: boolean;
  acceptMessages: boolean;
  createdAt: Date;
}

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
  isAcceptingConfessionReply: {
    type: Boolean,
    default: true,
  },
  acceptMessages: { type: Boolean, default: true },
  createdAt:{
    type: Date,
    default: Date.now
  }
});

const UserModel =
  (mongoose.models.User as mongoose.Model<User>) ||
  mongoose.model<User>("User", UserSchema);

export default UserModel;



