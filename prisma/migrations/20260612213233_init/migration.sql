-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` ENUM('APPLICANT', 'REVIEWER', 'ADMIN') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PumpStation` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PumpStation_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AlarmRecord` (
    `id` VARCHAR(191) NOT NULL,
    `recordNo` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `stationId` VARCHAR(191) NOT NULL,
    `currentHandlerId` VARCHAR(191) NOT NULL,
    `keyObject` VARCHAR(191) NOT NULL,
    `occurrenceTime` DATETIME(3) NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `evidenceConclusion` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'REVIEW', 'ARCHIVED', 'REJECTED', 'REOPENED') NOT NULL DEFAULT 'PENDING',
    `sampleType` ENUM('NORMAL_VERIFICATION', 'MISSING_FIELDS', 'ATTACHMENT_MISMATCH', 'REPROCESS') NULL,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `archivedAt` DATETIME(3) NULL,
    `archivedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AlarmRecord_recordNo_key`(`recordNo`),
    INDEX `AlarmRecord_status_idx`(`status`),
    INDEX `AlarmRecord_sampleType_idx`(`sampleType`),
    INDEX `AlarmRecord_isArchived_idx`(`isArchived`),
    INDEX `AlarmRecord_occurrenceTime_idx`(`occurrenceTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RecordNode` (
    `id` VARCHAR(191) NOT NULL,
    `recordId` VARCHAR(191) NOT NULL,
    `nodeType` ENUM('ACCEPT', 'PROCESS', 'SUPPLEMENT', 'REVIEW', 'ARCHIVE', 'REJECT', 'REOPEN') NOT NULL,
    `operatorId` VARCHAR(191) NOT NULL,
    `operatorName` VARCHAR(191) NOT NULL,
    `remark` VARCHAR(191) NULL,
    `blockReason` VARCHAR(191) NULL,
    `remedyPath` VARCHAR(191) NULL,
    `beforeSnapshot` JSON NOT NULL,
    `afterSnapshot` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RecordNode_recordId_idx`(`recordId`),
    INDEX `RecordNode_nodeType_idx`(`nodeType`),
    INDEX `RecordNode_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FieldDiff` (
    `id` VARCHAR(191) NOT NULL,
    `recordId` VARCHAR(191) NOT NULL,
    `nodeId` VARCHAR(191) NULL,
    `fieldName` VARCHAR(191) NOT NULL,
    `fieldLabel` VARCHAR(191) NOT NULL,
    `oldValue` VARCHAR(191) NOT NULL,
    `newValue` VARCHAR(191) NOT NULL,
    `diffType` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FieldDiff_recordId_idx`(`recordId`),
    INDEX `FieldDiff_nodeId_idx`(`nodeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attachment` (
    `id` VARCHAR(191) NOT NULL,
    `recordId` VARCHAR(191) NOT NULL,
    `nodeId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `size` BIGINT NOT NULL,
    `uploadedBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Attachment_recordId_idx`(`recordId`),
    INDEX `Attachment_nodeId_idx`(`nodeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AlarmRecord` ADD CONSTRAINT `AlarmRecord_stationId_fkey` FOREIGN KEY (`stationId`) REFERENCES `PumpStation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecordNode` ADD CONSTRAINT `RecordNode_recordId_fkey` FOREIGN KEY (`recordId`) REFERENCES `AlarmRecord`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecordNode` ADD CONSTRAINT `RecordNode_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FieldDiff` ADD CONSTRAINT `FieldDiff_recordId_fkey` FOREIGN KEY (`recordId`) REFERENCES `AlarmRecord`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FieldDiff` ADD CONSTRAINT `FieldDiff_nodeId_fkey` FOREIGN KEY (`nodeId`) REFERENCES `RecordNode`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attachment` ADD CONSTRAINT `Attachment_recordId_fkey` FOREIGN KEY (`recordId`) REFERENCES `AlarmRecord`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attachment` ADD CONSTRAINT `Attachment_nodeId_fkey` FOREIGN KEY (`nodeId`) REFERENCES `RecordNode`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
