import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateLoanScheduleTable1753789603975
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if columns exist before adding them
    const tableExists = await queryRunner.hasTable('loan_schedule');
    if (!tableExists) {
      return;
    }

    // Check each column individually and add only if it doesn't exist
    const hasApplicationFeeDue = await queryRunner.hasColumn(
      'loan_schedule',
      'applicationFeeDue',
    );
    if (!hasApplicationFeeDue) {
      await queryRunner.query(
        `ALTER TABLE "loan_schedule" ADD COLUMN "applicationFeeDue" decimal(12,2) NULL`,
      );
    }

    const hasApplicationFeePaid = await queryRunner.hasColumn(
      'loan_schedule',
      'applicationFeePaid',
    );
    if (!hasApplicationFeePaid) {
      await queryRunner.query(
        `ALTER TABLE "loan_schedule" ADD COLUMN "applicationFeePaid" decimal(12,2) NULL`,
      );
    }

    const hasServiceFeeDue = await queryRunner.hasColumn(
      'loan_schedule',
      'serviceFeeDue',
    );
    if (!hasServiceFeeDue) {
      await queryRunner.query(
        `ALTER TABLE "loan_schedule" ADD COLUMN "serviceFeeDue" decimal(12,2) NULL`,
      );
    }

    const hasServiceFeePaid = await queryRunner.hasColumn(
      'loan_schedule',
      'serviceFeePaid',
    );
    if (!hasServiceFeePaid) {
      await queryRunner.query(
        `ALTER TABLE "loan_schedule" ADD COLUMN "serviceFeePaid" decimal(12,2) NULL`,
      );
    }

    const hasBalance = await queryRunner.hasColumn('loan_schedule', 'balance');
    if (!hasBalance) {
      await queryRunner.query(
        `ALTER TABLE "loan_schedule" ADD COLUMN "balance" decimal(12,2) NOT NULL DEFAULT 0`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if columns exist before dropping them
    const tableExists = await queryRunner.hasTable('loan_schedule');
    if (!tableExists) {
      return;
    }

    const hasApplicationFeeDue = await queryRunner.hasColumn(
      'loan_schedule',
      'applicationFeeDue',
    );
    if (hasApplicationFeeDue) {
      await queryRunner.query(
        `ALTER TABLE "loan_schedule" DROP COLUMN "applicationFeeDue"`,
      );
    }

    const hasApplicationFeePaid = await queryRunner.hasColumn(
      'loan_schedule',
      'applicationFeePaid',
    );
    if (hasApplicationFeePaid) {
      await queryRunner.query(
        `ALTER TABLE "loan_schedule" DROP COLUMN "applicationFeePaid"`,
      );
    }

    const hasServiceFeeDue = await queryRunner.hasColumn(
      'loan_schedule',
      'serviceFeeDue',
    );
    if (hasServiceFeeDue) {
      await queryRunner.query(
        `ALTER TABLE "loan_schedule" DROP COLUMN "serviceFeeDue"`,
      );
    }

    const hasServiceFeePaid = await queryRunner.hasColumn(
      'loan_schedule',
      'serviceFeePaid',
    );
    if (hasServiceFeePaid) {
      await queryRunner.query(
        `ALTER TABLE "loan_schedule" DROP COLUMN "serviceFeePaid"`,
      );
    }

    const hasBalance = await queryRunner.hasColumn('loan_schedule', 'balance');
    if (hasBalance) {
      await queryRunner.query(
        `ALTER TABLE "loan_schedule" DROP COLUMN "balance"`,
      );
    }
  }
}
