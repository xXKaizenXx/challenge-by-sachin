import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusToAuditTable1728640000000 implements MigrationInterface {
  name = 'AddStatusToAuditTable1728640000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if audits table exists before making any changes
    const tableExists = await queryRunner.hasTable('audits');
    if (!tableExists) {
      console.log('Audits table does not exist, skipping migration');
      return;
    }

    // Check if enum type already exists
    const enumExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'audit_status_enum'
      )
    `);

    // Create enum type for audit status if it doesn't exist
    if (!enumExists[0].exists) {
      await queryRunner.query(`
        CREATE TYPE "audit_status_enum" AS ENUM (
          'success',
          'failed', 
          'error',
          'pending',
          'partial',
          'cancelled'
        )
      `);
    }

    // Check if status column already exists
    const columnExists = await queryRunner.hasColumn('audits', 'status');
    
    // Add status column to audits table with enum constraint if it doesn't exist
    if (!columnExists) {
      await queryRunner.query(`
        ALTER TABLE "audits" 
        ADD COLUMN "status" "audit_status_enum" DEFAULT 'success'
      `);
    }

    // Check if index already exists
    const indexExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'IDX_audit_status'
      )
    `);

    // Create index for status field for better query performance if it doesn't exist
    if (!indexExists[0].exists) {
      await queryRunner.query(`
        CREATE INDEX "IDX_audit_status" ON "audits" ("status")
      `);
    }

    // Update existing records to have 'success' status only after column is added
    const statusColumnExists = await queryRunner.hasColumn('audits', 'status');
    if (statusColumnExists) {
      await queryRunner.query(`
        UPDATE "audits" 
        SET "status" = 'success' 
        WHERE "status" IS NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if audits table exists before making any changes
    const tableExists = await queryRunner.hasTable('audits');
    if (!tableExists) {
      console.log('Audits table does not exist, skipping rollback');
      return;
    }

    // Check if index exists before dropping it
    const indexExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'IDX_audit_status'
      )
    `);

    if (indexExists[0].exists) {
      await queryRunner.query(`DROP INDEX "IDX_audit_status"`);
    }
    
    // Check if status column exists before dropping it
    const columnExists = await queryRunner.hasColumn('audits', 'status');
    if (columnExists) {
      await queryRunner.query(`ALTER TABLE "audits" DROP COLUMN "status"`);
    }
    
    // Check if enum type exists before dropping it
    const enumExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'audit_status_enum'
      )
    `);

    if (enumExists[0].exists) {
      await queryRunner.query(`DROP TYPE "audit_status_enum"`);
    }
  }
}