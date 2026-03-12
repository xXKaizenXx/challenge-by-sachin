import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingStatusesToDatabase1760534911088 implements MigrationInterface {
    name = 'AddMissingStatusesToDatabase1760534911088'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if 'Due' value already exists in the loan_schedule_status_enum
        const dueExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 
                FROM pg_enum e
                JOIN pg_type t ON t.oid = e.enumtypid
                WHERE t.typname = 'loan_schedule_status_enum'
                AND e.enumlabel = 'Due'
            ) as exists
        `);

        // Add 'Due' enum value if it doesn't exist
        if (!dueExists[0].exists) {
            await queryRunner.query(`ALTER TYPE "loan_schedule_status_enum" ADD VALUE 'Due'`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove 'Due' status from the statuses table    
        // Note: PostgreSQL doesn't support removing enum values directly
        // The 'Due' value will remain in the enum type but won't be used
        console.warn('WARNING: Cannot remove "Due" enum value from loan_schedule_status_enum. Manual intervention may be required if complete rollback is needed.');
    }

}
