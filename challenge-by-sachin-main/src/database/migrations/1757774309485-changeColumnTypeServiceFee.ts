import { MigrationInterface, QueryRunner } from 'typeorm';

export class changeColumnTypeServiceFee1757774309485
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "loans"
            ALTER COLUMN "service_fee" TYPE numeric(12,2)
            USING "service_fee"::numeric
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "loans"
            ALTER COLUMN "service_fee" TYPE integer
            USING ROUND("service_fee")::integer
        `);
  }
}
