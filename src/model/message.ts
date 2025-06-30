// import mongoose, { Document } from 'mongoose';

// export interface IMessage extends Document {
//   sender: mongoose.Types.ObjectId;
//   receiver: mongoose.Types.ObjectId;
//   content: string;
//   createdAt: Date;
//   read: boolean;
// }

// const messageSchema = new mongoose.Schema<IMessage>({
//   sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   content: { type: String, required: true },
//   createdAt: { type: Date, default: Date.now },
//   read: { type: Boolean, default: false }
// });



// const Message =
//   mongoose.models.Message || mongoose.model<IMessage>("Message", messageSchema);

// export default Message;
