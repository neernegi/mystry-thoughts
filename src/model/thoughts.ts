import mongoose, { Document, Schema, Types } from "mongoose";

export interface IReply {
  _id?: Types.ObjectId;
  user: Types.ObjectId;
  reply: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IThought extends Document {
  user: Types.ObjectId;
  thought: string;
  image: string[];
  thoughtReplies: IReply[];
  createdAt: Date;
  updatedAt: Date;
}

const ReplySchema: Schema<IReply> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reply: { type: String, required: true },
    // Removed replyOfreplies to flatten structure
  },
  {
    timestamps: true,
  }
);

const ThoughtSchema: Schema<IThought> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    thought: { type: String, required: true },
    image: [{ type: String }],
    thoughtReplies: [ReplySchema],
  },
  {
    timestamps: true,
  }
);

const ThoughtModel =
  mongoose.models.Thought || mongoose.model<IThought>("Thought", ThoughtSchema);

export default ThoughtModel;