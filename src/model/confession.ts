import mongoose, { Document, Schema, Types } from "mongoose";

// Interface for reply
export interface IReply {
  _id?: Types.ObjectId;
  user: Types.ObjectId;
  replyConfession: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Main IConfession interface
export interface IConfession extends Document {
  _id: string;
  user: Types.ObjectId;
  confession: string;
  repliesToConfession: IReply[];
  createdAt: Date;
  updatedAt: Date;
}

// Schema for nested replies
const ReplyToConfessionSchema: Schema<IReply> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    replyConfession: { type: String, required: true },
  },
  { timestamps: true }
);

// Schema for confession
const ConfessionSchema: Schema<IConfession> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    confession: { type: String, required: true },
    repliesToConfession: [ReplyToConfessionSchema],
  },
  { timestamps: true }
);

const ConfessionModel =
  mongoose.models.Confession ||
  mongoose.model<IConfession>("Confession", ConfessionSchema);

export default ConfessionModel;
