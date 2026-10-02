// src/controllers/message.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/mockAuth';
import Message from '../models/message.model';
import User from '../models/user.model';
import Chat from '../models/chat.model';
export const fetchMessages = async (req: AuthRequest, res: Response) => {
    try {
        const messages = await Message.find({ chat: req.params.chatId })
            .populate('sender', 'name profilePic email')
            .populate('chat')
            .sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch messages" });
    }
};

// POST /api/messages
// Send a new message in a specific chat
export const sendMessage = async (req: AuthRequest, res: Response) => {
    // 1. Extract data from the request
    const { content, chatId } = req.body;

    // Check if chatId is provided
    if (!chatId) {
        return res.status(400).json({ message: "chatId is required" });
    }

    // A message must have either text content OR an image
    if (!content && !req.file) {
        return res.status(400).json({ message: "Message content or an image is required" });
    }

    // Check if an image was uploaded
    const imagePath = req.file?.path || "";

    const newMessageData = {
        sender: req.user?._id,
        content: content,
        chat: chatId,
        readBy: [req.user?._id],
        image: imagePath,
        time: new Date().toLocaleTimeString(),
    };

    try {
        // 2. Save the new message to the database
        let message = await Message.create(newMessageData);

        // 2. Populate the sender and chat data so the frontend can render it immediately
        message = await message.populate([
            {
                path: 'sender',
                select: 'name profilePic'
            },
            {
                path: 'chat',
                populate: {
                    path: 'users',
                    select: 'name profilePic email'
                }
            }
        ]);

        // 3. Update the Chat document with this new message as the latestMessage
        await Chat.findByIdAndUpdate(chatId, {
            latestMessage: message._id,
        });

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ error: "Failed to send message" });
    }
};

// PUT /api/messages/mark-read
export const markMessagesAsRead = async (req: AuthRequest, res: Response) => {
    const { targetUserId } = req.body;

    if (!targetUserId) {
        return res.status(400).json({ message: "targetUserId is required" });
    }

    try {
        // Find the chat between current user and target user
        const chat = await Chat.findOne({
            isGroupChat: false,
            users: { $all: [req.user?._id, targetUserId] }
        });

        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        // Update all messages in this chat where readBy doesn't include current user
        await Message.updateMany(
            { chat: chat._id, readBy: { $ne: req.user?._id } },
            { $addToSet: { readBy: req.user?._id } }
        );

        res.status(200).json({ message: "Messages marked as read" });
    } catch (error) {
        res.status(500).json({ error: "Failed to mark messages as read" });
    }
};