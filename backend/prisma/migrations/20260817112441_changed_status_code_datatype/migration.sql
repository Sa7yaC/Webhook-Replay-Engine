/*
  Warnings:

  - Changed the type of `status_code` on the `replay` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "replay" DROP COLUMN "status_code",
ADD COLUMN     "status_code" INTEGER NOT NULL;
