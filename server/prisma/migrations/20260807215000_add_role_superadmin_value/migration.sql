-- Split out of 20260807220000_add_multiempresa: Postgres refuses to use a newly
-- added enum value in the same transaction that added it ("unsafe use of new
-- value... New enum values must be committed before they can be used"), and
-- Prisma runs each migration.sql as a single transaction. The multiempresa
-- migration both adds 'SUPERADMIN' to "Role" and immediately filters on it in an
-- UPDATE, so it can only work if the enum value was committed by a prior,
-- separate migration. This is that migration.

DO $$ BEGIN
  ALTER TYPE "Role" ADD VALUE 'SUPERADMIN';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
