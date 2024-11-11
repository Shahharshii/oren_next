// pages/api/auth/register.ts
import { NextRequest, NextResponse } from 'next/server';
import usermodel from '@/models/UserModel';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import connectDB from '@/utlis/db';


const getUserModel = () => {
    return mongoose.models.User || usermodel;
};

export const POST = async (req: NextRequest) => {
    try {
        await connectDB();
        const UserModel = getUserModel();
        console.log('Received registration request:', {
            ...req.body,
            password: '*' // Hide password in logs
        });

        const { name, email, password } = await req.json();

        // Validate input
        if (!name || !email || !password) {
            return NextResponse.json({
                success: false,
                message: "All fields are required"
            });
        }

        // Check email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({
                success: false,
                message: "Invalid email format"
            });
        }

        // Check if user exists
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return NextResponse.json({
                success: false,
                message: "User with this email already exists"
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);



        // Create user
        const user = await new UserModel({
            name,
            email,
            password: hashedPassword
        }).save();

        console.log('User created successfully:', user._id);

        return NextResponse.json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error: Error | unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json({
            success: false,
            message: message
        });
    }
};

