import { Router, Request, Response } from "express";
import { accessChat, fetchChats } from "../controllers/chatcontroller";
import { protect } from "../middleware/mockAuth"
const router = Router();
router.use(protect);
router.post("/accesschat", accessChat);
router.get("/fetchchats", fetchChats);
export default router;