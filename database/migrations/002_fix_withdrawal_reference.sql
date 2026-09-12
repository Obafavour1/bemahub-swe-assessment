-- 002_fix_withdrawal_reference.sql
-- Correct the unique constraint on wp_bl_withdrawals so payout_reference is truly unique per instructor.
--
-- The initial constraint in 001 included cancelled_at, which is NULL for active/pending withdrawals.
-- In MySQL, multiple NULL values are permitted in unique indexes, allowing duplicate rows with identical
-- (instructor_id, payout_reference) when cancelled_at is NULL.
-- Dropping cancelled_at from the index enforces strict idempotency.

ALTER TABLE wp_bl_withdrawals DROP INDEX uq_reference;
ALTER TABLE wp_bl_withdrawals ADD UNIQUE KEY uq_reference (instructor_id, payout_reference);
