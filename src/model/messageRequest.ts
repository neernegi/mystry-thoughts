import { Schema, Document, Types, model, models } from "mongoose";

export interface IMessageRequest extends Document {
  sender: Types.ObjectId;       // User who sent the request
  recipient: Types.ObjectId;    // User who received the request
  status: "pending" | "accepted" | "rejected";
  relatedMatch?: Types.ObjectId; // Optional reference to the Match document
  createdAt: Date;
  updatedAt: Date;
}

const MessageRequestSchema = new Schema<IMessageRequest>(
  {
    sender: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    recipient: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    status: { 
      type: String, 
      enum: ["pending", "accepted", "rejected"], 
      default: "pending" 
    },
    relatedMatch: { 
      type: Schema.Types.ObjectId, 
      ref: "Match" 
    }
  },
  { 
    timestamps: true // Adds createdAt and updatedAt automatically
  }
);

// Prevent duplicate requests between the same users
MessageRequestSchema.index(
  { sender: 1, recipient: 1 }, 
  { unique: true }
);

export default models.MessageRequest || model<IMessageRequest>("MessageRequest", MessageRequestSchema);