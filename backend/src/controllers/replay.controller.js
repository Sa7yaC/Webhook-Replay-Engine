import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import axios from "axios";
import { validateTargetUrl } from "../utils/urlSecurity.js";

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const MAX_WEBHOOK_BODY_SIZE = 20 * 1024;

export const webhookReplay = async (req, res) => {
    try {
        const targetUrl = req.body.targetUrl;
        const webhookID = req.params.id;

        let validatedUrl;

        try {
            validatedUrl = await validateTargetUrl(targetUrl);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

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

        const bodySize = Buffer.byteLength(
            JSON.stringify(webhookBody),
            "utf8"
        );

        if (bodySize > MAX_WEBHOOK_BODY_SIZE) {
            return res.status(413).json({
                success: false,
                message: "Webhook body exceeds the 20 KB limit"
            });
        }

        const safeHeaders = {};

        const allowedHeaders = [
            "content-type",
            "accept",
            "user-agent"
        ];

        for (const header of allowedHeaders) {
            if (
                webhookHeaders &&
                webhookHeaders[header]
            ) {
                safeHeaders[header] = webhookHeaders[header];
            }
        }

        const startTime = performance.now();

        const response = await axios.post(
            validatedUrl.toString(),
            webhookBody,
            {
                headers: safeHeaders,

                timeout: 10_000,

                maxRedirects: 0,

                validateStatus: () => true
            }
        );

        const endTime = performance.now();

        const duration = (endTime - startTime).toFixed(2);

        await prisma.replay.create({
            data: {
                webhook_id: webhookID,
                target_url: validatedUrl.toString(),
                status_code: response.status,
                response_body: String(response.data),
                duration: `${duration}ms`,
                success:
                    response.status >= 200 &&
                    response.status < 300
            }
        });

        return res.status(200).json({
            success: true,
            status: response.status,
            duration: `${duration}ms`,
            targetUrl: validatedUrl.toString()
        });

    } catch (error) {
        console.error("Webhook replay error:", error);

        if (error.code === "ECONNABORTED") {
            return res.status(504).json({
                success: false,
                message: "Target server took too long to respond"
            });
        }

        if (
            error.response &&
            error.response.status >= 300 &&
            error.response.status < 400
        ) {
            return res.status(400).json({
                success: false,
                message: "Target URL redirects to another location, which is not allowed"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to replay webhook"
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
            webhook_id: true,
            target_url: true,
            status_code: true,
            duration: true,
            success: true
        }
    });
    return res.status(200).json(fetchedReplay);
}