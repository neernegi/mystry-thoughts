import mongoose, { Document, Schema, Types } from "mongoose";

// Main IConfession interface
export interface IConfession extends Document {
  _id: string; // Explicitly adding string for frontend compatibility
  user: Types.ObjectId;
  confession: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema for confession (No replies array)
const ConfessionSchema: Schema<IConfession> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    confession: { type: String, required: true },
  },
  { timestamps: true }
);

const ConfessionModel =
  mongoose.models.Confession ||
  mongoose.model<IConfession>("Confession", ConfessionSchema);

export default ConfessionModel;