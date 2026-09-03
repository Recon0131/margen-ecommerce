-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "images" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "thumbnail" TEXT;
