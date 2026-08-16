-- CreateTable
CREATE TABLE "webhook" (
    "id" SERIAL NOT NULL,
    "webhook_id" TEXT NOT NULL,
    "method" TEXT,
    "headers" JSONB NOT NULL,
    "body" JSONB NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_pkey" PRIMARY KEY ("id")
);
