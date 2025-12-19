/*
  Warnings:

  - You are about to drop the column `days` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `instructorId` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Section` table. All the data in the column will be lost.
  - The `modality` column on the `Section` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Section` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[name]` on the table `Instructor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[termId,classNumber]` on the table `Section` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Modality" AS ENUM ('IN_PERSON', 'ONLINE_SYNC', 'ONLINE_ASYNC', 'HYBRID', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "SectionStatus" AS ENUM ('OPEN', 'CLOSED', 'WAITLIST', 'UNKNOWN');

-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_instructorId_fkey";

-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_termId_fkey";

-- DropIndex
DROP INDEX "Section_instructorId_idx";

-- AlterTable
ALTER TABLE "Section" DROP COLUMN "days",
DROP COLUMN "endTime",
DROP COLUMN "instructorId",
DROP COLUMN "location",
DROP COLUMN "startTime",
DROP COLUMN "modality",
ADD COLUMN     "modality" "Modality" NOT NULL DEFAULT 'UNKNOWN',
DROP COLUMN "status",
ADD COLUMN     "status" "SectionStatus" NOT NULL DEFAULT 'UNKNOWN';

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "days" TEXT,
    "startMin" INTEGER,
    "endMin" INTEGER,
    "building" TEXT,
    "room" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionInstructor" (
    "sectionId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,

    CONSTRAINT "SectionInstructor_pkey" PRIMARY KEY ("sectionId","instructorId")
);

-- CreateIndex
CREATE INDEX "Meeting_sectionId_idx" ON "Meeting"("sectionId");

-- CreateIndex
CREATE INDEX "Meeting_days_idx" ON "Meeting"("days");

-- CreateIndex
CREATE INDEX "Meeting_startMin_endMin_idx" ON "Meeting"("startMin", "endMin");

-- CreateIndex
CREATE INDEX "SectionInstructor_instructorId_idx" ON "SectionInstructor"("instructorId");

-- CreateIndex
CREATE INDEX "Course_subject_number_idx" ON "Course"("subject", "number");

-- CreateIndex
CREATE INDEX "Course_title_idx" ON "Course"("title");

-- CreateIndex
CREATE INDEX "Instructor_name_idx" ON "Instructor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_name_key" ON "Instructor"("name");

-- CreateIndex
CREATE INDEX "Section_termId_modality_idx" ON "Section"("termId", "modality");

-- CreateIndex
CREATE INDEX "Section_termId_status_idx" ON "Section"("termId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Section_termId_classNumber_key" ON "Section"("termId", "classNumber");

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionInstructor" ADD CONSTRAINT "SectionInstructor_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionInstructor" ADD CONSTRAINT "SectionInstructor_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
