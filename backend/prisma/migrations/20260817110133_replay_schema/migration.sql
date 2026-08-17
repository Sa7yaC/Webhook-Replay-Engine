-- CreateTable
CREATE TABLE "replay" (
    "id" SERIAL NOT NULL,
    "webhook_id" TEXT NOT NULL,
    "target_url" TEXT NOT NULL,
    "status_code" TEXT NOT NULL,
    "response_body" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "replay_pkey" PRIMARY KEY ("id")
);
