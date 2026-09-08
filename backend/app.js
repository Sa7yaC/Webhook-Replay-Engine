import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express()
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            return callback(null, true);
        }
        if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use(express.json({limit: '20kb'}))
app.use(express.urlencoded({ extended: true, limit: '20kb' }))
app.use(express.static("public"))

import webhookroutes from './src/routes/webhook.routes.js';
import replayRoutes from './src/routes/replay.routes.js'

app.use("/api/v1", webhookroutes);
app.use("/api/v1", replayRoutes);
export { app };