import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStaffIdOfficeIdCenterIdToLoanSchedule1757310754966 implements MigrationInterface {
    name = 'AddStaffIdOfficeIdCenterIdToLoanSchedule1757310754966'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // --- Loan Schedule ---
        await queryRunner.query(`ALTER TABLE "loan_schedule" ADD "staff_id" uuid NULL`);
        await queryRunner.query(`ALTER TABLE "loan_schedule" ADD "center_id" uuid NULL`);
        await queryRunner.query(`ALTER TABLE "loan_schedule" ADD "office_id" uuid NULL`);
        // Add foreign key constraints
        await queryRunner.query(`ALTER TABLE "loan_schedule" ADD CONSTRAINT "FK_loan_schedule_staff" FOREIGN KEY ("staff_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "loan_schedule" ADD CONSTRAINT "FK_loan_schedule_center" FOREIGN KEY ("center_id") REFERENCES "center"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "loan_schedule" ADD CONSTRAINT "FK_loan_schedule_office" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE SET NULL ON UPDATE CASCADE`);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback Loan Schedule
        await queryRunner.query(`ALTER TABLE "loan_schedule" DROP CONSTRAINT "FK_loan_schedule_office"`);
        await queryRunner.query(`ALTER TABLE "loan_schedule" DROP CONSTRAINT "FK_loan_schedule_center"`);
        await queryRunner.query(`ALTER TABLE "loan_schedule" DROP CONSTRAINT "FK_loan_schedule_staff"`);
        await queryRunner.query(`ALTER TABLE "loan_schedule" DROP COLUMN "office_id"`);
        await queryRunner.query(`ALTER TABLE "loan_schedule" DROP COLUMN "center_id"`);
        await queryRunner.query(`ALTER TABLE "loan_schedule" DROP COLUMN "staff_id"`);
    }

}
