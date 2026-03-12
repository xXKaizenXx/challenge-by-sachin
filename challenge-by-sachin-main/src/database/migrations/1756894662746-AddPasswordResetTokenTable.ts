import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordResetTokenTable1756894464624 implements MigrationInterface {
    name = 'AddPasswordResetTokenTable1756894464624'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "password_reset_tokens" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "token" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "expires_at" TIMESTAMP,
                "used" boolean NOT NULL DEFAULT false,
                "user_id" uuid,
                CONSTRAINT "PK_d16bebd73e844c48bca50ff8d3d" PRIMARY KEY ("id"),
                CONSTRAINT "FK_52ac39dd8a28730c63aeb428c9c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
    }
}