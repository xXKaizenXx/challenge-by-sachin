import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class modifyTransactionTable1754270283731 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make schedule relation nullable
    await queryRunner.query(`
          ALTER TABLE "loan_transactions" 
          ALTER COLUMN "schedule_id" DROP NOT NULL
        `);

    // Make collectedBy relation nullable

    await queryRunner.query(`
          ALTER TABLE "loan_transactions"
          ALTER COLUMN "collected_by_id" DROP NOT NULL
        `);

    // Add new debit column
    await queryRunner.addColumn(
      'loan_transactions',
      new TableColumn({
        name: 'debit',
        type: 'decimal',
        precision: 12,
        isNullable: false,
        scale: 2,
        default: 0.0,
      }),
    );

    // Add new credit column
    await queryRunner.addColumn(
      'loan_transactions',
      new TableColumn({
        name: 'credit',
        type: 'decimal',
        precision: 12,
        isNullable: false,
        scale: 2,
        default: 0.0,
      }),
    );

    // Drop old amount columns
    await queryRunner.dropColumn('loan_transactions', 'amount');
    await queryRunner.dropColumn('loan_transactions', 'principal_amount');
    await queryRunner.dropColumn('loan_transactions', 'interest_amount');
    await queryRunner.dropColumn('loan_transactions', 'penalty_amount');
    await queryRunner.dropColumn('loan_transactions', 'fee_amount');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate old amount columns
    await queryRunner.addColumn(
      'loan_transactions',
      new TableColumn({
        name: 'amount',
        type: 'decimal',
        precision: 12,
        scale: 2,
        isNullable: false,
      }),
    );

    await queryRunner.addColumn(
      'loan_transactions',
      new TableColumn({
        name: 'principalAmount',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0.0,
      }),
    );

    await queryRunner.addColumn(
      'loan_transactions',
      new TableColumn({
        name: 'interestAmount',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0.0,
      }),
    );

    await queryRunner.addColumn(
      'loan_transactions',
      new TableColumn({
        name: 'penaltyAmount',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0.0,
      }),
    );

    await queryRunner.addColumn(
      'loan_transactions',
      new TableColumn({
        name: 'feeAmount',
        type: 'decimal',
        precision: 12,
        scale: 2,
        default: 0.0,
      }),
    );

    // Remove new columns
    await queryRunner.dropColumn('loan_transactions', 'debit');
    await queryRunner.dropColumn('loan_transactions', 'credit');

    // Make schedule relation non-nullable again
    await queryRunner.query(`
          ALTER TABLE "loan_transactions" 
          ALTER COLUMN "scheduleId" SET NOT NULL
        `);

    // Make collectedBy relation non-nullable again
    await queryRunner.query(`
          ALTER TABLE "loan_transactions" 
          ALTER COLUMN "collectedById" SET NOT NULL
        `);
  }
}
