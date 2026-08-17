import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const getWebhook = async(req,res)=>{
    const webhooks = await prisma.webhook.findMany({
        select:{
            id: true,
            webhook_id: true,
            method: true,
            received_at: true
        }
    });
    console.log(webhooks);

    return res.status(200).json(webhooks);
}

export const getCertainWebhook = async(req,res)=>{
    const webhookID = Number(req.params.id);
    const selectedWebhook = await prisma.webhook.findUnique({
        where:
        {
            id: webhookID,
        },
        select:{
            id:true,
            webhook_id:true,
            method: true,
            headers: true,
            body: true,
            received_at: true
        }
    });
    return res.status(200).json(selectedWebhook);
}

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