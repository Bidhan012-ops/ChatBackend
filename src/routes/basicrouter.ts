import { Router } from "express";
import { finduser, getuserdetails, updateprofile } from "../controllers/basiccontroller";
import { protect } from "../middleware/mockAuth";
const router = Router();
router.use(protect);
router.get("/finduser", finduser);
router.post("/userdetails", getuserdetails);
router.put("/updateprofile", updateprofile);
export default router;