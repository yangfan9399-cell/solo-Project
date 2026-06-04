-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING_HANDLER', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ID_CARD', 'HOUSEHOLD_REGISTER', 'INCOME_PROOF', 'MEDICAL_CERTIFICATE', 'DIFFICULTY_PROOF', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('MISSING', 'PROVIDED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "SubsidyLevel" AS ENUM ('LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('SUBMIT_APPLICATION', 'UPLOAD_DOCUMENT', 'ADJUST_SUBSIDY_LEVEL', 'ADD_NOTE', 'APPROVE', 'REJECT', 'ARCHIVE', 'REOPEN');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('HANDLER', 'REVIEWER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "applicantIdCard" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING_HANDLER',
    "subsidyLevel" "SubsidyLevel" NOT NULL DEFAULT 'LEVEL_3',
    "originalLevel" "SubsidyLevel",
    "exceedsStandard" BOOLEAN NOT NULL DEFAULT false,
    "approvalPath" TEXT,
    "currentHandlerId" TEXT,
    "currentReviewerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archiveReason" TEXT,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "occupation" TEXT NOT NULL,
    "monthlyIncome" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "healthStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL,
    "uploadDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubsidyStandard" (
    "id" TEXT NOT NULL,
    "level" "SubsidyLevel" NOT NULL,
    "name" TEXT NOT NULL,
    "minIncome" DECIMAL(65,30) NOT NULL,
    "maxIncome" DECIMAL(65,30) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubsidyStandard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalLog" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionType" "ActionType" NOT NULL,
    "description" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiveRecord" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "conclusion" TEXT NOT NULL,
    "finalAmount" DECIMAL(65,30) NOT NULL,
    "archivedBy" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchiveRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReopenRecord" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "reopenReason" TEXT NOT NULL,
    "reopenedBy" TEXT NOT NULL,
    "originalConclusion" TEXT NOT NULL,
    "originalAmount" DECIMAL(65,30) NOT NULL,
    "reopenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReopenRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubsidyStandard_level_key" ON "SubsidyStandard"("level");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_currentHandlerId_fkey" FOREIGN KEY ("currentHandlerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_currentReviewerId_fkey" FOREIGN KEY ("currentReviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalLog" ADD CONSTRAINT "ApprovalLog_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalLog" ADD CONSTRAINT "ApprovalLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveRecord" ADD CONSTRAINT "ArchiveRecord_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReopenRecord" ADD CONSTRAINT "ReopenRecord_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
