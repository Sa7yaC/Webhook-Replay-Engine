import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const storeWebhook = async (req, res) => {
  const webhookStorage = await prisma.webhook.create({
    data: {
      webhook_id: req.params.id,
      method: req.method,
      headers: req.headers,
      body: req.body,
    },
  });

  console.log(`Webhook ID: ${req.params.id}`);
  console.log(`Method: ${req.method}`);
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  console.log("Saved webhook:", webhookStorage);

  res.sendStatus(200);
};