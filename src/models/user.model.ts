import mongoose, { Schema, Document } from "mongoose";
export interface IUser extends Document {
    name: string;
    email: string;
    passwordHash: string;
    profilepic?: string;
    bio?: string;
}
const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    passwordHash: { type: String, required: true },
    profilepic: { type: String, default: "" },
    bio: { type: String, default: "Hi Everyone, I am Using ichat!" }
}, { timestamps: true })
export default mongoose.model<IUser>("User", UserSchema)