import {asyncHandler} from "./../utils/asyncHandler.js";
import mongoose from "mongoose";

const indexRoute = asyncHandler(async(req,res)=>{
    res.status(200).send({
        success:true,
        message:"Welcome to backend API",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Health check endpoint
export const healthCheck = asyncHandler(async(req,res)=>{
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.status(200).json({
        success: true,
        message: "API is healthy",
        status: {
            api: 'healthy',
            database: dbStatus,
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        }
    });
});

export default indexRoute;