import express from "express";
import { webhookReplay, fetchWebhookReplay} from "../controllers/replay.controller";

const router = express.Router();

router.post('/webhook/:id/replay', webhookReplay);
router.get('/webhook/:id/replay', fetchWebhookReplay);


export default router;