import express from "express";
import { webhookReplay } from "../controllers/replay.controller";

const router = express.Router();

router.post('/webhook/:id/replay', webhookReplay);


export default router;