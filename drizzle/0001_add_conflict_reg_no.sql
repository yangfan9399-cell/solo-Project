-- Migration: add_conflict_reg_no_to_disputes
-- Description: Add conflict_reg_no column to disputes table for duplicate registration tracking
-- Created at: 2025-06-04

-- Add conflict_reg_no column
ALTER TABLE disputes
ADD COLUMN conflict_reg_no VARCHAR(20) NULL AFTER registration_id;

-- Optional: add index for faster queries on conflict_reg_no
CREATE INDEX idx_dispute_conflict ON disputes(conflict_reg_no);
