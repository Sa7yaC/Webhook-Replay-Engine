import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


function formatBytes(bytes) {
    if (bytes == null || isNaN(bytes) || bytes <= 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(2)} KB`;
}

export const getWebhook = async (req, res) => {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : 200;
        const { range, startDate, endDate, from, to } = req.query;

        const where = {};
        let start = null;
        let end = null;

        const rawStart = startDate || from;
        const rawEnd = endDate || to;

        if (rawStart) {
            const parsed = new Date(rawStart);
            if (!isNaN(parsed.getTime())) {
                start = parsed;
            }
        }

        if (rawEnd) {
            const parsed = new Date(rawEnd);
            if (!isNaN(parsed.getTime())) {
                end = parsed;
            }
        }

        // If no explicit start date but range name is supplied
        if (!start && range) {
            const r = range.toLowerCase().trim();
            const now = new Date();
            if (r === 'today') {
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            } else if (r === 'last 24 hours' || r === '24h') {
                start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            } else if (r === 'last 7 days' || r === '7d') {
                start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            } else if (r === 'last 30 days' || r === '30d') {
                start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            }
        }

        if (start) {
            where.received_at = {
                ...(where.received_at || {}),
                gte: start
            };
        }

        if (end) {
            where.received_at = {
                ...(where.received_at || {}),
                lte: end
            };
        }

        const [webhooks, count, replays] = await Promise.all([
            prisma.webhook.findMany({
                where,
                take: limit > 0 ? limit : undefined,
                orderBy: {
                    received_at: 'desc'
                },
                select: {
                    id: true,
                    webhook_id: true,
                    method: true,
                    headers: true,
                    body: true,
                    received_at: true
                }
            }),
            prisma.webhook.count({ where }),
            prisma.replay.findMany({
                take: 500,
                orderBy: {
                    created_at: 'desc'
                },
                select: {
                    id: true,
                    webhook_id: true,
                    status_code: true,
                    success: true,
                    created_at: true
                }
            }).catch(() => [])
        ]);

        // Map latest replay by webhook_id
        const replayMap = {};
        for (const rep of replays) {
            if (!replayMap[rep.webhook_id]) {
                replayMap[rep.webhook_id] = rep;
            }
        }

        const enrichedWebhooks = webhooks.map((wh) => {
            let sizeBytes = 0;
            if (wh.headers && (wh.headers['content-length'] || wh.headers['Content-Length'])) {
                sizeBytes = Number(wh.headers['content-length'] || wh.headers['Content-Length']);
            }
            if (!sizeBytes && wh.body) {
                try {
                    sizeBytes = Buffer.byteLength(JSON.stringify(wh.body), 'utf8');
                } catch {
                    sizeBytes = 0;
                }
            }

            const rep = replayMap[wh.webhook_id];
            const isFailed = rep ? (!rep.success || rep.status_code >= 400) : false;
            const status = isFailed ? 'Failed' : 'Completed';
            const statusCode = rep?.status_code || 200;

            return {
                id: wh.id,
                webhook_id: wh.webhook_id,
                method: wh.method || 'POST',
                status,
                status_code: statusCode,
                size: sizeBytes > 0 ? formatBytes(sizeBytes) : '120 B',
                received_at: wh.received_at
            };
        });

        return res.status(200).json({
            success: true,
            data: enrichedWebhooks,
            count
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