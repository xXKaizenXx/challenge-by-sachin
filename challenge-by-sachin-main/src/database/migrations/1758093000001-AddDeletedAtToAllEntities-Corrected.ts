import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeletedAtToAllEntities1660000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP NULL`);
    await queryRunner.query(`ALTER TABLE "loan_transactions" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP NULL`);
    await queryRunner.query(`ALTER TABLE "center_meeting_dates" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP NULL`);
    await queryRunner.query(`ALTER TABLE "genders" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP NULL`);
    await queryRunner.query(`ALTER TABLE "offices" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP NULL`);
    await queryRunner.query(`ALTER TABLE "loan_schedule" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP NULL`);
    await queryRunner.query(`ALTER TABLE "banks" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP NULL`);
    await queryRunner.query(`ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP NULL`);
    await queryRunner.query(`ALTER TABLE "accruals" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP NULL`);
    await queryRunner.query(`ALTER TABLE "center" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP NULL`);
    await queryRunner.query(`ALTER TABLE "group_packages" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP NULL`);
    await queryRunner.query(`ALTER TABLE "groups" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP NULL`);
    await queryRunner.query(`ALTER TABLE "chart_of_accounts" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP NULL`);
    await queryRunner.query(`ALTER TABLE "statuses" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP NULL`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN IF EXISTS "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "loan_transactions" DROP COLUMN IF EXISTS "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "center_meeting_dates" DROP COLUMN IF EXISTS "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "genders" DROP COLUMN IF EXISTS "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "offices" DROP COLUMN IF EXISTS "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "loan_schedule" DROP COLUMN IF EXISTS "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "banks" DROP COLUMN IF EXISTS "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "loans" DROP COLUMN IF EXISTS "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "accruals" DROP COLUMN IF EXISTS "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "center" DROP COLUMN IF EXISTS "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "group_packages" DROP COLUMN IF EXISTS "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN IF EXISTS "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "chart_of_accounts" DROP COLUMN IF EXISTS "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "statuses" DROP COLUMN IF EXISTS "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "deleted_at"`);
  }
}
