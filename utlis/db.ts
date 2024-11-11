import mongoose from "mongoose";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectDB = async () => {
    if (mongoose.connection.readyState === 0) {
        try {
            await mongoose.connect(process.env.MONGODB_URI as string);
            console.log('MongoDB Connected successfully');
        } catch (error) {
            console.error('Failed connection:', error);
        }
    }
};

export default connectDB;
