import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function calculatePercentageChange(current, previous, hasComparison) {
    if (!hasComparison || previous == null) return null;
    if (previous === 0) {
        return current === 0 ? 0 : null;
    }
    const change = ((current - previous) / previous) * 100;
    return Number(change.toFixed(1));
}

export const getMetrics = async (req, res) => {
    try {
        const { range, startDate, endDate, from, to } = req.query;

        const now = new Date();
        let currentStart = null;
        let currentEnd = now;
        let previousStart = null;
        let previousEnd = null;
        let hasComparison = false;

        const rawStart = startDate || from;
        const rawEnd = endDate || to;
        const r = (range || 'Last 7 days').toLowerCase().trim();

        if (rawStart) {
            const parsedStart = new Date(rawStart);
            if (!isNaN(parsedStart.getTime())) {
                currentStart = parsedStart;
                if (rawEnd) {
                    const parsedEnd = new Date(rawEnd);
                    if (!isNaN(parsedEnd.getTime())) {
                        currentEnd = parsedEnd;
                    }
                }
                const duration = currentEnd.getTime() - currentStart.getTime();
                previousEnd = currentStart;
                previousStart = new Date(currentStart.getTime() - duration);
                hasComparison = true;
            }
        } else {

            if (r === 'today') {
                currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                currentEnd = now;
                const elapsedToday = currentEnd.getTime() - currentStart.getTime();
                previousStart = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
                previousEnd = new Date(previousStart.getTime() + elapsedToday);
                hasComparison = true;
            } else if (r === 'last 24 hours' || r === '24h' || r === '1 day' || r === '1d') {
                currentStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                currentEnd = now;
                previousStart = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
                previousEnd = currentStart;
                hasComparison = true;
            } else if (r === 'last 7 days' || r === '7d' || r === '7 days') {
                currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                currentEnd = now;
                previousStart = new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000);
                previousEnd = currentStart;
                hasComparison = true;
            } else if (r === 'last 30 days' || r === '30d' || r === '30 days') {
                currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                currentEnd = now;
                previousStart = new Date(currentStart.getTime() - 30 * 24 * 60 * 60 * 1000);
                previousEnd = currentStart;
                hasComparison = true;
            } else {
                // All time
                currentStart = null;
                currentEnd = now;
                previousStart = null;
                previousEnd = null;
                hasComparison = false;
            }
        }

        const currentWebhookWhere = {};
        if (currentStart) {
            currentWebhookWhere.received_at = {
                gte: currentStart,
                lte: currentEnd,
            };
        }

        const currentReplayWhere = {};
        if (currentStart) {
            currentReplayWhere.created_at = {
                gte: currentStart,
                lte: currentEnd,
            };
        }

        const prevWebhookWhere = hasComparison && previousStart ? {
            received_at: {
                gte: previousStart,
                ...(previousEnd ? { lte: previousEnd } : {}),
            },
        } : null;

        const prevReplayWhere = hasComparison && previousStart ? {
            created_at: {
                gte: previousStart,
                ...(previousEnd ? { lte: previousEnd } : {}),
            },
        } : null;

        const [
            totalWebhooksCurrent,
            totalWebhooksPrevious,
            totalReplaysCurrent,
            totalReplaysPrevious,
            successfulReplaysCurrent,
            successfulReplaysPrevious,
            failedReplaysCurrent,
            failedReplaysPrevious,
        ] = await Promise.all([
            prisma.webhook.count({ where: currentWebhookWhere }),
            prevWebhookWhere ? prisma.webhook.count({ where: prevWebhookWhere }) : Promise.resolve(0),
            prisma.replay.count({ where: currentReplayWhere }),
            prevReplayWhere ? prisma.replay.count({ where: prevReplayWhere }) : Promise.resolve(0),
            prisma.replay.count({ where: { ...currentReplayWhere, success: true } }),
            prevReplayWhere ? prisma.replay.count({ where: { ...prevReplayWhere, success: true } }) : Promise.resolve(0),
            prisma.replay.count({ where: { ...currentReplayWhere, success: false } }),
            prevReplayWhere ? prisma.replay.count({ where: { ...prevReplayWhere, success: false } }) : Promise.resolve(0),
        ]);

        const truncUnit = (r === 'last 24 hours' || r === '24h' || r === '1 day' || r === '1d') ? 'hour' : 'day';
        const [webhookBuckets, replayBuckets] = await Promise.all([
            pool.query(
                `SELECT DATE_TRUNC($1, received_at) as period, count(*)::int as count 
                 FROM webhook 
                 ${currentStart ? 'WHERE received_at >= $2 AND received_at <= $3' : ''} 
                 GROUP BY 1 ORDER BY 1 ASC`,
                currentStart ? [truncUnit, currentStart, currentEnd] : [truncUnit]
            ).then(res => res.rows).catch(() => []),
            pool.query(
                `SELECT DATE_TRUNC($1, created_at) as period, count(*)::int as count 
                 FROM replay 
                 ${currentStart ? 'WHERE created_at >= $2 AND created_at <= $3' : ''} 
                 GROUP BY 1 ORDER BY 1 ASC`,
                currentStart ? [truncUnit, currentStart, currentEnd] : [truncUnit]
            ).then(res => res.rows).catch(() => [])
        ]);

        return res.status(200).json({
            success: true,
            data: {
                timeRange: range || 'Last 7 days',
                hasComparison,
                timeline: {
                    webhooks: webhookBuckets,
                    replays: replayBuckets,
                },
                webhooks: {
                    current: totalWebhooksCurrent,
                    previous: totalWebhooksPrevious,
                    change: calculatePercentageChange(totalWebhooksCurrent, totalWebhooksPrevious, hasComparison),
                },
                replays: {
                    current: totalReplaysCurrent,
                    previous: totalReplaysPrevious,
                    change: calculatePercentageChange(totalReplaysCurrent, totalReplaysPrevious, hasComparison),
                },
                successful: {
                    current: successfulReplaysCurrent,
                    previous: successfulReplaysPrevious,
                    change: calculatePercentageChange(successfulReplaysCurrent, successfulReplaysPrevious, hasComparison),
                },
                failed: {
                    current: failedReplaysCurrent,
                    previous: failedReplaysPrevious,
                    change: calculatePercentageChange(failedReplaysCurrent, failedReplaysPrevious, hasComparison),
                },
            },
        });
    } catch (error) {
        console.error("Error computing metrics:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to compute dashboard metrics",
        });
    }
};
