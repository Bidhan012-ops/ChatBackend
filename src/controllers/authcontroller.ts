import { Request, Response } from "express";
import User from "../models/user.model";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const signupController = async (req: Request, res: Response) => {
    const validationerror = validationResult(req);
    if (!validationerror.isEmpty()) {
        return res.status(400).json({ message: validationerror.array()[0].msg })
    }

    const { name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            passwordHash: hashedPassword,
        });

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET as string,
            { expiresIn: "30d" }
        );

        // HTTP-ONLY COOKIE IMPLEMENTATION
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // True in production
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        const safeUser = {
            _id: user._id,
            name: user.name,
            email: user.email,
            profilepic: user.profilepic,
            bio: user.bio,
        };
        // Send user data, but DO NOT send the token in the JSON!
        res.status(201).json({ user: safeUser });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "some internal error has occured" });
    }
}

export const loginController = async (req: Request, res: Response) => {
    const validationerror = validationResult(req);
    if (!validationerror.isEmpty()) {
        return res.status(400).json({ message: validationerror.array() })
    }

    const { email, password } = req.body;

    try {
        // BUG FIX 2: You must add .select("+passwordHash") here!
        // By default, the schema hides the password so it doesn't accidentally leak.
        // If you don't explicitly select it, user.passwordHash will be undefined.
        const user = await User.findOne({ email }).select("+passwordHash");

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" })
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET as string,
            { expiresIn: "30d" }
        );

        // HTTP-ONLY COOKIE IMPLEMENTATION
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        // We remove the passwordHash from the user object before sending it to the frontend
        const safeUser = {
            _id: user._id,
            name: user.name,
            email: user.email,
            profilepic: user.profilepic,
            bio: user.bio,
        };

        res.status(200).json({ user: safeUser });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "some internal error has occured" });
    }
}

// src/controllers/auth.controller.ts

export const logoutController = async (req: Request, res: Response) => {
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0), // Sets the expiration date to the past so the browser deletes it
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    res.status(200).json({ message: "Logged out successfully" });
};