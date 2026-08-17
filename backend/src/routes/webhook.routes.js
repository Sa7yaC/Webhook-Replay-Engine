import express from 'express';
import { storeWebhook, getWebhook, getCertainWebhook } from '../controllers/webhook.controller.js';

const router = express.Router();

router.post('/webhook/:id', storeWebhook);
router.get('/webhook', getWebhook);
router.get('/webhook/:id', getCertainWebhook);


export default router;
