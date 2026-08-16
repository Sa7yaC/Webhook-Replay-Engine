import express from 'express';
import { storeWebhook } from '../controllers/webhook.controller.js';

const router = express.Router();

router.post('/webhook/:id', storeWebhook);

export default router;
