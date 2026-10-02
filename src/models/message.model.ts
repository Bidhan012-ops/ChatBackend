// src/models/message.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
    sender: mongoose.Types.ObjectId;
    content: string;
    chat: mongoose.Types.ObjectId;
    readBy: mongoose.Types.ObjectId[];
}

const MessageSchema: Schema = new Schema({
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, required: false },
    chat: { type: Schema.Types.ObjectId, ref: 'Chat' },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    time: { type: String, required: true },
    image: { type: String, required: false },
}, { timestamps: true });

export default mongoose.model<IMessage>('Message', MessageSchema);