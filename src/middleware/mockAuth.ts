// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 1. Grab the token directly from the cookies!
    // (This matches the name "token" you used in res.cookie("token", ...))
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, please login first" });
    }

    // 2. Verify the token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

    // 3. Find the user and attach it to the request
    req.user = await User.findById(decoded.id).select("-passwordHash");

    // 4. Move on to the controller
    next();

  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).json({ message: "Session expired or invalid token" });
  }
};