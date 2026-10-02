import { Router } from "express";
import { signupController, loginController, logoutController } from "../controllers/authcontroller";
import { body } from "express-validator";
import { protect } from "../middleware/mockAuth";
import { AuthRequest } from "../middleware/mockAuth";
const router = Router();
router.post("/signup", [body("email").isEmail().withMessage("Invalid email address"),
body("name").isLength({ min: 3 }).withMessage("Name must be at least 3 characters long"),
body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long").
    matches(/[0-9]/).withMessage("Password must contain at least one number").
    matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage("Password must contain at least one special character")
], signupController);

router.post("/signin", [body("email").isEmail().withMessage("Invalid email address"),
body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long").
    matches(/[0-9]/).withMessage("Password must contain at least one number").
    matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage("Password must contain at least one special character")
], loginController);

router.post("/logout", logoutController);

router.get("/me", protect, (req: AuthRequest, res) => {
    return res.status(200).json({ user: req.user });
});
export default router;