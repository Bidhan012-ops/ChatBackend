// src/controllers/chat.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/mockAuth';
import Chat from '../models/chat.model';
import User from '../models/user.model';
import Message from '../models/message.model';

// POST /api/chats
// Create a new 1-on-1 chat or return the existing one
export const accessChat = async (req: AuthRequest, res: Response) => {
    const { targetUserId } = req.body;

    if (!targetUserId) {
        return res.status(400).json({ message: "targetUserId is required" });
    }

    try {
        // Check if a 1-on-1 chat already exists between these two users
        let existingChat = await Chat.findOne({
            isGroupChat: false,
            users: { $all: [req.user?._id, targetUserId] }
        }).populate('users', '-passwordHash').populate('latestMessage');

        if (existingChat) {
            return res.status(200).json(existingChat);
        }

        // If it doesn't exist, create a new one
        const chatData = {
            chatName: "sender",
            isGroupChat: false,
            users: [req.user?._id, targetUserId],
        };

        const createdChat = await Chat.create(chatData);
        const fullChat = await Chat.findOne({ _id: createdChat._id }).populate('users', '-passwordHash');

        res.status(201).json(fullChat);
    } catch (error) {
        res.status(500).json({ error: "Failed to access chat" });
    }
};

// GET /api/chats
// Fetch all chats for the logged-in user
export const fetchChats = async (req: AuthRequest, res: Response) => {
    try {
        const results = await Chat.find({ users: { $elemMatch: { $eq: req.user?._id } } })
            .populate('users', '-passwordHash')
            .populate('groupAdmin', '-passwordHash')
            .populate('latestMessage')
            .sort({ updatedAt: -1 }); // Sort by newest first

        const chatsWithUnreadCount = await Promise.all(
            results.map(async (chat) => {
                const unreadCount = await Message.countDocuments({
                    chat: chat._id,
                    readBy: { $ne: req.user?._id }
                });
                return { ...chat.toObject(), unreadCount };
            })
        );

        res.status(200).json(chatsWithUnreadCount);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch chats" });
    }
};