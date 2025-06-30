import { Schema, Document, Types, model, models } from "mongoose";

export interface IChatRoom extends Document {
  participants: Types.ObjectId[];
}

const ChatRoomSchema = new Schema<IChatRoom>({
  participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
});
export default models.ChatRoom || model<IChatRoom>("ChatRoom", ChatRoomSchema);
