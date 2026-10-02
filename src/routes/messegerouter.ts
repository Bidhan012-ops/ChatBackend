import { Router } from "express";
import { sendMessage, fetchMessages, markMessagesAsRead } from "../controllers/messagecontroller";
import { protect } from "../middleware/mockAuth";
import upload from "../config/multerConfig";

const router = Router();
router.use(protect);
router.post("/sendmessage", upload.single("image"), sendMessage);
router.get("/fetchmessages/:chatId", fetchMessages);
router.put("/mark-read", markMessagesAsRead);

export default router;