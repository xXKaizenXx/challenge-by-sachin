import { MigrationInterface, QueryRunner } from 'typeorm';

export class addTotalPaidColumn1754268151697 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "loan_schedule"
            ADD COLUMN "total_paid" decimal(12,2) NOT NULL DEFAULT 0
          `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "loan_schedule"
            DROP COLUMN "total_paid"
          `);
  }
}
