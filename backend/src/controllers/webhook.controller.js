import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


export const getWebhook = async (req, res) => {
    try {
        const webhooks = await prisma.webhook.findMany({
            select: {
                id: true,
                webhook_id: true,
                method: true,
                received_at: true
            }
        });

        return res.status(200).json({
            success: true,
            data: webhooks
        });

    } catch (error) {
        console.error("Error fetching webhooks:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch webhooks"
        });
    }
};


export const getCertainWebhook = async (req, res) => {
    try {
        const webhookID = Number(req.params.id);

        if (Number.isNaN(webhookID)) {
            return res.status(400).json({
                success: false,
                message: "Invalid webhook ID"
            });
        }

        const selectedWebhook = await prisma.webhook.findUnique({
            where: {
                id: webhookID,
            },
            select: {
                id: true,
                webhook_id: true,
                method: true,
                headers: true,
                body: true,
                received_at: true
            }
        });

        if (!selectedWebhook) {
            return res.status(404).json({
                success: false,
                message: "Webhook not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: selectedWebhook
        });

    } catch (error) {
        console.error("Error fetching webhook:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch webhook"
        });
    }
};


export const storeWebhook = async (req, res) => {
    try {
        const webhookStorage = await prisma.webhook.create({
            data: {
                webhook_id: req.params.id,
                method: req.method,
                headers: req.headers,
                body: req.body,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Webhook stored successfully",
            webhook_id: webhookStorage.webhook_id
        });

    } catch (error) {
        console.error("Error storing webhook:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to store webhook"
        });
    }
};