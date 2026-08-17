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
        const webhookID = req.params.id;

        const dataFetched = await prisma.webhook.findFirst({
            where: {
                webhook_id: webhookID,
            },
            select: {
                headers: true,
                body: true,
                webhook_id: true
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

        const startTime = performance.now();

        const response = await axios.post(
            targetUrl,
            {
                // headers: webhookHeaders,
                body: webhookBody
            }
        );

        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);
        const replayStorage = await prisma.replay.create({
            data:{
                webhook_id: webhookID,
                target_url: targetUrl,
                status_code: response.status,
                response_body: String(response.data),
                duration: `${duration}ms`,
                success: response.status >= 200 && response.status < 300
            }
        });

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

export const fetchWebhookReplay = async(req,res)=>{
    const webhookID = req.params.id;
    
    const fetchedReplay = await prisma.replay.findMany({
        where:{
            webhook_id: webhookID,
        },
        select:{
            id: true,
            target_url: true,
            status_code: true,
            duration: true,
            success: true
        }
    });
    return res.status(200).json(fetchedReplay);
}