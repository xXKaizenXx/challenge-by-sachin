import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompletedToGroupPackagesEnum1762000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the enum type exists
    const typeExistsResult = await queryRunner.query(`
      SELECT 1 FROM pg_type WHERE typname = 'group_packages_status_enum';
    `);

    if (!typeExistsResult || typeExistsResult.length === 0) {
      // Enum type doesn't exist — nothing to do
      console.log("Enum type 'group_packages_status_enum' does not exist. Skipping migration.");
      return;
    }

    // Get existing enum values
    const enumValuesResult = await queryRunner.query(`
      SELECT enumlabel
      FROM pg_enum
      WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'group_packages_status_enum'
      );
    `);

    const existingValues = enumValuesResult.map((row: any) => row.enumlabel);

    if (!existingValues.includes('Completed')) {
      await queryRunner.query(`ALTER TYPE "group_packages_status_enum" ADD VALUE 'Completed';`);
    } else {
      console.log("Enum value 'Completed' already exists on 'group_packages_status_enum'. Skipping.");
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Removing enum values is not supported by PostgreSQL safely — no-op
    console.log('Down migration not supported: PostgreSQL does not allow removing enum values.');
  }
}
