-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "idCard" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "breed" TEXT,
    "age" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "gender" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hospitalization" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "primaryDiagnosis" TEXT NOT NULL,
    "secondaryDiagnosis" TEXT,
    "admissionDate" TIMESTAMP(3) NOT NULL,
    "dischargeDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ADMITTED',
    "ward" TEXT,
    "cageNumber" TEXT,
    "chiefComplaint" TEXT,
    "anomalyType" TEXT NOT NULL DEFAULT 'NONE',
    "anomalyNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hospitalization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalOrder" (
    "id" TEXT NOT NULL,
    "hospitalizationId" TEXT NOT NULL,
    "orderType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "dosage" TEXT,
    "frequency" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT NOT NULL,
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NursingRecord" (
    "id" TEXT NOT NULL,
    "hospitalizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "recordedById" TEXT NOT NULL,
    "recordTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "temperature" DOUBLE PRECISION,
    "heartRate" INTEGER,
    "respiratoryRate" INTEGER,
    "bloodPressure" TEXT,
    "weight" DOUBLE PRECISION,
    "appetite" TEXT,
    "stool" TEXT,
    "urine" TEXT,
    "mentalStatus" TEXT,
    "isAbnormal" BOOLEAN NOT NULL DEFAULT false,
    "abnormalNote" TEXT,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NursingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeItem" (
    "id" TEXT NOT NULL,
    "hospitalizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "totalPrice" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "disputeNote" TEXT,
    "recordDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeReview" (
    "id" TEXT NOT NULL,
    "hospitalizationId" TEXT NOT NULL,
    "reviewedById" TEXT NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "actualAmount" DECIMAL(65,30),
    "reviewNote" TEXT,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hospitalization" ADD CONSTRAINT "Hospitalization_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hospitalization" ADD CONSTRAINT "Hospitalization_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalOrder" ADD CONSTRAINT "MedicalOrder_hospitalizationId_fkey" FOREIGN KEY ("hospitalizationId") REFERENCES "Hospitalization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalOrder" ADD CONSTRAINT "MedicalOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalOrder" ADD CONSTRAINT "MedicalOrder_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NursingRecord" ADD CONSTRAINT "NursingRecord_hospitalizationId_fkey" FOREIGN KEY ("hospitalizationId") REFERENCES "Hospitalization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NursingRecord" ADD CONSTRAINT "NursingRecord_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NursingRecord" ADD CONSTRAINT "NursingRecord_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MedicalOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeItem" ADD CONSTRAINT "FeeItem_hospitalizationId_fkey" FOREIGN KEY ("hospitalizationId") REFERENCES "Hospitalization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeReview" ADD CONSTRAINT "FeeReview_hospitalizationId_fkey" FOREIGN KEY ("hospitalizationId") REFERENCES "Hospitalization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeReview" ADD CONSTRAINT "FeeReview_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
