// model/messageRequest.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IMessageRequest extends Document {
  sender: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "rejected";
  relatedMatch: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MessageRequestSchema: Schema<IMessageRequest> = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    relatedMatch: {
      type: Schema.Types.ObjectId,
      ref: "UserMatch", // CHANGED FROM "Match" to "UserMatch"
      required: true,
    },
  },
  { timestamps: true }
);

// Add index for faster queries
MessageRequestSchema.index({ sender: 1, recipient: 1 });
MessageRequestSchema.index({ status: 1 });

const MessageRequest =
  mongoose.models.MessageRequest ||
  mongoose.model<IMessageRequest>("MessageRequest", MessageRequestSchema);

export default MessageRequest;