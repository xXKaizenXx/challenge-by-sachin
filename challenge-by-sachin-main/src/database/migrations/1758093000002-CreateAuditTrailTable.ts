import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditTable1758093000002 implements MigrationInterface {
  name = 'CreateAuditTable1758093000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if audits table already exists
    const tableExists = await queryRunner.hasTable('audits');
    
    if (!tableExists) {
      await queryRunner.query(`
        CREATE TABLE "audits" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "auditable_type" VARCHAR(255) NOT NULL,
          "auditable_id" VARCHAR(255) NOT NULL,
          "event" VARCHAR(50) NOT NULL,
          "old_values" jsonb,
          "new_values" jsonb,
          "user_id" uuid,
          "url" VARCHAR(500),
          "ip_address" VARCHAR(45),
          "user_agent" TEXT,
          "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Create indexes for better query performance only if they don't exist
    const indexes = [
      { name: 'IDX_audits_auditable_type_id', query: 'CREATE INDEX "IDX_audits_auditable_type_id" ON "audits" ("auditable_type", "auditable_id")' },
      { name: 'IDX_audits_user_id', query: 'CREATE INDEX "IDX_audits_user_id" ON "audits" ("user_id")' },
      { name: 'IDX_audits_event', query: 'CREATE INDEX "IDX_audits_event" ON "audits" ("event")' },
      { name: 'IDX_audits_created_at', query: 'CREATE INDEX "IDX_audits_created_at" ON "audits" ("created_at")' }
    ];

    for (const index of indexes) {
      const indexExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE indexname = '${index.name}'
        )
      `);

      if (!indexExists[0].exists) {
        await queryRunner.query(index.query);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if audits table exists before trying to drop it
    const tableExists = await queryRunner.hasTable('audits');
    
    if (tableExists) {
      // Drop indexes first if they exist
      const indexes = [
        'IDX_audits_auditable_type_id',
        'IDX_audits_user_id', 
        'IDX_audits_event',
        'IDX_audits_created_at'
      ];

      for (const indexName of indexes) {
        const indexExists = await queryRunner.query(`
          SELECT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = '${indexName}'
          )
        `);

        if (indexExists[0].exists) {
          await queryRunner.query(`DROP INDEX "${indexName}"`);
        }
      }

      // Drop the table
      await queryRunner.query(`DROP TABLE "audits"`);
    }
  }
}