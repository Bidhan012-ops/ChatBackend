import { Request, Response } from "express";
import User from "../models/user.model"
import cloudinary from "../config/cloudinary";
import { AuthRequest } from "../middleware/mockAuth";
export const finduser = async (req: Request, res: Response) => {
    const keyword = req.query.searchedUser as string;
    if (!keyword) {
        return res.status(400).json({ message: "No search term provided" });
    }
    const users = await User.find({ name: { $regex: keyword, $options: "i" } });
    if (!users) {
        return res.status(404).json([{ message: "No users found" }]);
    }
    res.status(200).json(users);
}
export const getuserdetails = async (req: Request, res: Response) => {
    const userId = req.body.targetuserId;
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
}
export const updateprofile = async (req: AuthRequest, res: Response) => {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    if (req.body.profilepic) {
        const result = await cloudinary.uploader.upload(req.body.profilepic, {
            folder: 'my_uploads', // Optional: organizes files into a folder in Cloudinary
            transformation: [
                { width: 400, height: 400, crop: "fill", gravity: "face" }
            ]
        });
        user.profilepic = result.secure_url;
    }
    user.name = req.body.fullName;
    user.bio = req.body.bio;
    await user.save();
    res.status(200).json(user);
}