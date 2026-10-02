// src/server.ts
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io'; // 1. Import Socket.io

import chatRoutes from "./routes/chatrouter";
import messageRoutes from "./routes/messegerouter";
import authrouter from "./routes/authrouter";
import cookieParser from "cookie-parser";
import basicrouter from "./routes/basicrouter";
dotenv.config();
const app = express();
app.use(cors(
    {
        origin: process.env.CLIENT_URL,
        credentials: true
    }
));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use("/api/basic", basicrouter);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/auth', authrouter);
mongoose.connect(process.env.MONGO_URI as string)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('DB Connection Error: ', err));

const PORT = process.env.PORT || 5000;

// 2. Save the server instance to a variable
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// 3. Initialize Socket.io and attach it to the server
const io = new Server(server, {
    pingTimeout: 60000, // Wait 60 seconds before closing an inactive connection
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173", // The URL of your frontend React/Next.js app
    },
});

// 4. Listen for connections
const onlineusers = new Set();

io.on("connection", (socket) => {
    console.log("Connected to socket.io");
    let currentUserId: string | null = null;
    
    socket.on("setup", (userId) => {
        socket.join(userId);
        currentUserId = userId;
        onlineusers.add(userId);
        socket.emit("connected");
        io.emit("online-users", Array.from(onlineusers));
        console.log(`User ${userId} is online and joined their personal room`);
    });
    
    socket.on("join chat", (chatId) => {
        socket.join(chatId);
        console.log("User joined chat room: " + chatId);
    });
    
    socket.on("typing", (data) => {
        // Send the event name "typing", AND pass the userName as the data payload
        socket.in(data.room).emit("typing", data.userName);
    });

    socket.on("stop typing", (data) => {
        socket.in(data.room).emit("stop typing");
    });
    
    socket.on("newmessage", (newMessageRecieved) => {
        var chat = newMessageRecieved.chat;
        if (!chat || !chat.users) return;
        if (!newMessageRecieved.sender || !newMessageRecieved.sender._id) {
            console.error("Invalid sender in newmessage event:", newMessageRecieved);
            return;
        }

        chat.users.forEach((user: any) => {
            console.log(user, newMessageRecieved.sender);
            if (user._id === newMessageRecieved.sender._id) {
                console.log("User is same as sender");
            } else {
                const messageToSend = {
                    ...newMessageRecieved,
                    chatId: chat._id,
                    time: newMessageRecieved.time || new Date().toDateString()
                };
                socket.in(user._id).emit("message", messageToSend);
            }
        });
    });

    // --- WebRTC Signaling ---
    socket.on("webrtc-offer", (data) => {
        socket.in(data.targetUserId).emit("webrtc-offer", {
            offer: data.offer,
            callerId: currentUserId,
            callType: data.callType
        });
    });

    socket.on("webrtc-answer", (data) => {
        socket.in(data.callerId).emit("webrtc-answer", {
            answer: data.answer
        });
    });

    socket.on("webrtc-ice-candidate", (data) => {
        socket.in(data.targetId).emit("webrtc-ice-candidate", {
            candidate: data.candidate
        });
    });

    socket.on("webrtc-end-call", (data) => {
        socket.in(data.targetId).emit("webrtc-call-ended");
    });
    // ------------------------

    socket.on("disconnect", () => {
        console.log("User disconnected");
        if (currentUserId) {
            onlineusers.delete(currentUserId);
            io.emit("online-users", Array.from(onlineusers));
        }
    });
});