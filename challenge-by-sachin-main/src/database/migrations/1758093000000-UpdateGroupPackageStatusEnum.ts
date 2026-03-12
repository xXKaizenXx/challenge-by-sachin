import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRejectedStatusToGroupPackagesEnum1758093000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if 'Rejected' exists in the enum already
    const enumValuesResult = await queryRunner.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'group_packages_status_enum'
      );
    `);

    const existingValues = enumValuesResult.map((row: any) => row.enumlabel);

    if (!existingValues.includes('Rejected')) {
      await queryRunner.query(`
        ALTER TYPE "group_packages_status_enum" ADD VALUE 'Rejected';
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Nothing to do — Postgres can’t drop enum values
    console.log('Down migration not supported: PostgreSQL does not allow removing enum values.');
  }
}
