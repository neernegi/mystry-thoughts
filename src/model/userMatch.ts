import mongoose, { Schema, Document, Types, model, models } from "mongoose";

export interface IMatch extends Document {
  user1: Types.ObjectId;
  user2: Types.ObjectId;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
}

const MatchSchema = new Schema<IMatch>({
  user1: { type: Schema.Types.ObjectId, ref: "User", required: true },
  user2: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});


const UserMatch =
  mongoose.models.UserMatch || mongoose.model<IMatch>("UserMatch", MatchSchema);

export default UserMatch;
