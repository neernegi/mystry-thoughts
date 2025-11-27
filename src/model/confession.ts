import mongoose, { Document, Schema, Types } from "mongoose";

export interface IConfession extends Document {
  _id: string; 
  user: Types.ObjectId;
  confession: string;
  createdAt: Date;
  updatedAt: Date;
}

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