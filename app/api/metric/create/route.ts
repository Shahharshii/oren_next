import { NextRequest, NextResponse } from 'next/server';
import Metric from '@/models/MetricModel';
import verifyToken from '@/utlis/verifytoken'; // Make sure this path is correct

import connectDB from '@/utlis/db'; // Import your database connection function if needed
import User from '@/models/UserModel';

export const POST = async (req: NextRequest) => {
    try {
        await connectDB(); // Ensure your database is connected
        const decoded = verifyToken(req);

        let userId;
        if ('id' in decoded) {
            userId = decoded.id;
        } else {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const user = await User.findById(userId);
        const metricsData = await req.json();

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 401 });
        }

        if (!Array.isArray(metricsData)) {
            return NextResponse.json({ message: "Invalid data format. Expected an array of metrics" }, { status: 400 });
        }

        const results = await Promise.all(
            metricsData.map(async (metric) => {
                const { carbonEmissions, energyConsumption, wasteGenerated, waterUsage, year } = metric;

                if (!carbonEmissions || !energyConsumption || !wasteGenerated || !waterUsage || !year) {
                    throw new Error(`Invalid metric data for year ${year}`);
                }

                // Try to find existing metric for the year
                const existingMetric = await Metric.findOne({ user, year });

                if (existingMetric) {
                    // Update existing metric
                    return await Metric.findOneAndUpdate(
                        { user, year },
                        {
                            carbonEmissions,
                            energyConsumption,
                            wasteDistributed: wasteGenerated,
                            waterUsage
                        },
                        { new: true }
                    );
                } else {
                    // Create new metric
                    return await Metric.create({
                        user,
                        carbonEmissions,
                        energyConsumption,
                        wasteDistributed: wasteGenerated,
                        waterUsage,
                        year
                    });
                }
            })
        );

        return NextResponse.json({
            message: "Metrics processed successfully",
            metrics: results
        }, { status: 201 });
    } catch (error: Error | unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json({ success: false, message });
    }
};