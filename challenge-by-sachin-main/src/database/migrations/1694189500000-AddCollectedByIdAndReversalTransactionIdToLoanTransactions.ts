import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCollectedByIdAndReversalTransactionIdToLoanTransactions1694189500000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("loan_transactions");
        if (table && !table.findColumnByName("collected_by_id")) {
            await queryRunner.query(`ALTER TABLE "loan_transactions" ADD COLUMN "collected_by_id" uuid NULL`);
        }
        if (table && !table.findColumnByName("reversal_transaction_id")) {
            await queryRunner.query(`ALTER TABLE "loan_transactions" ADD COLUMN "reversal_transaction_id" uuid NULL`);
        }
        // Add reversed_by_id if missing
        if (table && !table.findColumnByName("reversed_by_id")) {
            await queryRunner.query(`ALTER TABLE "loan_transactions" ADD COLUMN "reversed_by_id" uuid NULL`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("loan_transactions");
        if (table && table.findColumnByName("collected_by_id")) {
            await queryRunner.query(`ALTER TABLE "loan_transactions" DROP COLUMN "collected_by_id"`);
        }
        if (table && table.findColumnByName("reversal_transaction_id")) {
            await queryRunner.query(`ALTER TABLE "loan_transactions" DROP COLUMN "reversal_transaction_id"`);
        }
        // Remove reversed_by_id if exists
        if (table && table.findColumnByName("reversed_by_id")) {
            await queryRunner.query(`ALTER TABLE "loan_transactions" DROP COLUMN "reversed_by_id"`);
        }
    }
}
