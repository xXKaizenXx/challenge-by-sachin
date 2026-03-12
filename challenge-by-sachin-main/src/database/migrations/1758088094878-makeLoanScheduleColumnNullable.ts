import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeLoanScheduleColumnNullable1758088094878
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop default first, then allow NULLs
    await queryRunner.query(
      `ALTER TABLE "loan_schedule" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "loan_schedule" ALTER COLUMN "status" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Ensure there are no NULLs before re-adding NOT NULL
    await queryRunner.query(
      `UPDATE "loan_schedule" SET "status" = 'PENDING' WHERE "status" IS NULL`,
    );

    // Detect the enum type for proper casting in DEFAULT
    const res: Array<{ qname: string }> = await queryRunner.query(`
        SELECT format('%I.%I', n.nspname, t.typname) AS qname
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.oid = (
          SELECT atttypid
          FROM pg_attribute
          WHERE attrelid = 'loan_schedule'::regclass
            AND attname = 'status'
        )
        LIMIT 1
      `);

    const enumQName = res?.[0]?.qname;

    if (enumQName) {
      await queryRunner.query(
        `ALTER TABLE "loan_schedule" ALTER COLUMN "status" SET DEFAULT 'PENDING'::${enumQName}`,
      );
    } else {
      // Fallback (may work depending on server settings)
      await queryRunner.query(
        `ALTER TABLE "loan_schedule" ALTER COLUMN "status" SET DEFAULT 'PENDING'`,
      );
    }

    await queryRunner.query(
      `ALTER TABLE "loan_schedule" ALTER COLUMN "status" SET NOT NULL`,
    );
  }
}
