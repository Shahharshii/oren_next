import { NextRequest, NextResponse } from 'next/server';
import Metric from '@/models/MetricModel'; // Ensure this path is correct
import connectDB from '@/utlis/db'; // Import your database connection function if needed
import verifyToken from '@/utlis/verifytoken';

export const GET = async (req: NextRequest) => {
    try {
        await connectDB();

        // Verify token and extract user data
        const decoded = verifyToken(req);
        if ('id' in decoded) {
            const userId = decoded.id;

            // Query the metrics based on the userId
            const metrics = await Metric.find({ user: userId });
            return NextResponse.json({ metrics }, { status: 200 });
        }

        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
};