-- Migration: Add 'espera' status to task_status enum
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'espera';
