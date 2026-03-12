import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateColumnsLoanTable1753951882576 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // For PostgreSQL, we need to use USING to convert existing data
    await queryRunner.query(`
            ALTER TABLE loan_table 
            ALTER COLUMN installment TYPE NUMERIC(10,2) 
            USING installment::NUMERIC(10,2)

        `);

    await queryRunner.query(`
            ALTER TABLE loan_table 
            ALTER COLUMN maximum_application_fee TYPE NUMERIC(10,2) 
            USING maximum_application_fee::NUMERIC(10,2)

        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Convert back to integer, rounding decimal values
    await queryRunner.query(`
            ALTER TABLE loan_table 
            ALTER COLUMN installment TYPE INTEGER 
            USING ROUND(installment)
        `);
  }
}
