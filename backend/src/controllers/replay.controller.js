import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { json } from "express";
import axios from "axios";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const webhookReplay = async(req,res)=>{
    try {
        const targetUrl = req.body.targetUrl;
        const webhookID = Number(req.params.id);

        const dataFetched = await prisma.webhook.findUnique({
            where: {
                id: webhookID,
            },
            select: {
                headers: true,
                body: true
            }
        });

        if (!dataFetched) {
            return res.status(404).json({
                success: false,
                message: "Webhook not found"
            });
        }

        const webhookHeaders = dataFetched.headers;
        const webhookBody = dataFetched.body;

        console.log(targetUrl);
        console.log(webhookHeaders);
        console.log(webhookBody);

        const startTime = performance.now();

        const response = await axios.post(
            targetUrl,
            {
                headers: webhookHeaders,
                body: webhookBody
            }
        );

        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);

        return res.status(200).json({
            success: true,
            status: response.status,
            duration: `${duration}ms`,
            targetUrl: targetUrl
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to replay webhook",
            error: error.message
        });
    }
};