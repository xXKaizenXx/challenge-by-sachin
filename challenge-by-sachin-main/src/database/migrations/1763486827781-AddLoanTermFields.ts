import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLoanTermFields1763486827781 implements MigrationInterface {
  name = 'AddLoanTermFields1763486827781';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE loan_table
      ADD COLUMN term_length INT,
      ADD COLUMN term_unit VARCHAR(20);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE loan_table
      DROP COLUMN term_length,
      DROP COLUMN term_unit;
    `);
  }
}