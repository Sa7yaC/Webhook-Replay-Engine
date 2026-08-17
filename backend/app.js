import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express()
app.use(cookieParser());
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))

app.use(express.json({limit: '20kb'}))
app.use(express.urlencoded({ extended: true, limit: '20kb' }))
app.use(express.static("public"))

import webhookroutes from './src/routes/webhook.routes.js';
import replayRoutes from './src/routes/replay.routes.js'

app.use("/api/v1", webhookroutes);
app.use("/api/v1", replayRoutes);
export { app };