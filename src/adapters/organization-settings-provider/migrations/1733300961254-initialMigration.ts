import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1733300961254 implements MigrationInterface {
    name = "InitialMigration1733300961254";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "organization_settings"`);
        await queryRunner.query(
            `CREATE TABLE "organization_settings" ("slack_workspace_id" character varying NOT NULL, "github_organization_id" integer NOT NULL, "github_organization_login" character varying NOT NULL, "default_channel_participants" text array NOT NULL DEFAULT '{}', "repositories_to_exclude" text array NOT NULL DEFAULT '{}', "opened_p_rs_broadcast_channel" character varying, "opened_bot_p_rs_broadcast_channel" character varying, CONSTRAINT "PK_f4403a8ca68d8c610c6a8786e25" PRIMARY KEY ("slack_workspace_id", "github_organization_id", "github_organization_login"))`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "organization_settings"`);
    }
}
