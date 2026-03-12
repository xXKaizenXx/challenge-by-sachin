import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakePackageStatusEnum1758092683037 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Create the enum type with the exact literals from GroupPackageStatus
    await queryRunner.query(`
          CREATE TYPE "group_packages_status_enum" AS ENUM (
            'Awaiting Disbursement',
            'Active',
            'Pending'
          )
        `);

    // 2) Drop old default (it's 'pending' in text) to allow type change
    await queryRunner.query(`
          ALTER TABLE "group_packages"
          ALTER COLUMN "status" DROP DEFAULT
        `);

    // 3) Normalize existing text values before casting
    await queryRunner.query(`
          UPDATE "group_packages"
          SET "status" = CASE
            WHEN lower("status") = 'pending' THEN 'Pending'
            WHEN lower("status") = 'active' THEN 'Active'
            WHEN lower("status") IN ('awaiting disbursement','awaiting_disbursement','awaiting-disbursement') THEN 'Awaiting Disbursement'
            ELSE 'Pending'
          END
        `);

    // 4) Change column type to the new enum, preserving NOT NULL
    await queryRunner.query(`
          ALTER TABLE "group_packages"
          ALTER COLUMN "status" TYPE "group_packages_status_enum"
          USING "status"::"group_packages_status_enum"
        `);

    // 5) Set a new enum default
    await queryRunner.query(`
          ALTER TABLE "group_packages"
          ALTER COLUMN "status" SET DEFAULT 'Pending'::"group_packages_status_enum"
        `);

    // Ensure NOT NULL (column was already not null, but being explicit doesn't hurt)
    await queryRunner.query(`
          ALTER TABLE "group_packages"
          ALTER COLUMN "status" SET NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1) Drop the enum default to allow casting back to text
    await queryRunner.query(`
          ALTER TABLE "group_packages"
          ALTER COLUMN "status" DROP DEFAULT
        `);

    // 2) Cast back to text
    await queryRunner.query(`
          ALTER TABLE "group_packages"
          ALTER COLUMN "status" TYPE text
          USING "status"::text
        `);

    // 3) (Optional) Normalize to the legacy lowercase default style
    await queryRunner.query(`
          UPDATE "group_packages"
          SET "status" = CASE "status"
            WHEN 'Pending' THEN 'pending'
            WHEN 'Active' THEN 'active'
            WHEN 'Awaiting Disbursement' THEN 'awaiting disbursement'
            ELSE 'pending'
          END
        `);

    // 4) Restore the old default
    await queryRunner.query(`
          ALTER TABLE "group_packages"
          ALTER COLUMN "status" SET DEFAULT 'pending'
        `);

    // 5) Drop the enum type
    await queryRunner.query(`
          DROP TYPE "group_packages_status_enum"
        `);
  }
}
