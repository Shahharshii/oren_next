import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Define the types for the decoded token, if you have one
interface DecodedToken {
    userId: string;
    email: string;
    // Add any other fields you expect from the token
}

// Verify Token Function
const verifyToken = (req: NextRequest) => {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
        throw new Error('Unauthorized');
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as jwt.Secret) as DecodedToken;
        return decoded;
    } catch (error: Error | unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json({ success: false, message });
    }
};

export default verifyToken;