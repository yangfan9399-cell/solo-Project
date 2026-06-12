-- AlterTable
ALTER TABLE `RecordNode` MODIFY `blockReason` TEXT NULL,
    MODIFY `remedyPath` TEXT NULL;

-- AddForeignKey
ALTER TABLE `AlarmRecord` ADD CONSTRAINT `AlarmRecord_currentHandlerId_fkey` FOREIGN KEY (`currentHandlerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
