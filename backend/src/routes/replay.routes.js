import express from "express";
import { webhookReplay, fetchWebhookReplay, fetchAllReplays } from "../controllers/replay.controller";

const router = express.Router();

router.get('/replay', fetchAllReplays);
router.post('/webhook/:id/replay', webhookReplay);
router.get('/webhook/:id/replay', fetchWebhookReplay);


export default router;