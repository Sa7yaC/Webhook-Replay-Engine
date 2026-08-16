import express from 'express';
import { handleWebhook } from '../controllers/webhook.controller.js';

const router = express.Router();

router.post('/webhook/:id', handleWebhook);

export default router;
