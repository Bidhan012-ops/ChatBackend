import mongoose, { Schema, Document, mongo } from "mongoose";
export interface IChat extends Document {
    chatName: string;
    isGroupChat: boolean;
    users: mongoose.Types.ObjectId[];
    latestMessage?: mongoose.Types.ObjectId;
    groupAdmin?: mongoose.Types.ObjectId;
}
const ChatSchema: Schema = new Schema({
    chatName: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },
    users: [{ type: Schema.Types.ObjectId, ref: "User" }],
    latestMessage: { type: Schema.Types.ObjectId, ref: "Message" },
    groupAdmin: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true })
export default mongoose.model<IChat>("Chat", ChatSchema)