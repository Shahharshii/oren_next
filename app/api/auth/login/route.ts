// pages/api/auth/login.ts
import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/UserModel';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '@/utlis/db';

export const POST = async (req: NextRequest) => {
    try {
        await connectDB();
        const { email, password } = await req.json();
        if (!email || !password) {
            return NextResponse.json({ success: false, message: "All fields are required" });
        }

        const user = await User.findOne({ email });
        if (!user || !user.password) {
            return NextResponse.json({ success: false, message: "No user found" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid) {
            const accessToken = jwt.sign(
                { id: user._id, email: user.email },
                process.env.ACCESS_TOKEN_SECRET as string
            );

            return NextResponse.json({ success: true, token: accessToken, message: "User logged in", user });
        } else {
            return NextResponse.json({ success: false, message: "Invalid credentials" });
        }
    } catch (error: Error | unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json({ success: false, message });
    }
};

