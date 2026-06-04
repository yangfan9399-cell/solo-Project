-- Safe migration: add_conflict_reg_no_to_disputes
-- Compatible with MySQL - handles case when column already exists
-- Use this for schema initialization or seeding

DROP PROCEDURE IF EXISTS add_column_if_not_exists;

DELIMITER //
CREATE PROCEDURE add_column_if_not_exists()
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    ALTER TABLE disputes ADD COLUMN conflict_reg_no VARCHAR(20) NULL AFTER registration_id;
END //
DELIMITER ;

CALL add_column_if_not_exists();
DROP PROCEDURE IF EXISTS add_column_if_not_exists;

-- Add index (ignore if exists)
CREATE INDEX IF NOT EXISTS idx_dispute_conflict ON disputes(conflict_reg_no);
