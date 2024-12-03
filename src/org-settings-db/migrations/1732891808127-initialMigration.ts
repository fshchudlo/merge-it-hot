import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1732891808127 implements MigrationInterface {
    name = 'InitialMigration1732891808127'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "organization_settings" ("slack_workspace_id" character varying NOT NULL, "github_organization_id" character varying NOT NULL, "default_channel_participants" text array NOT NULL DEFAULT '{}', "opened_p_rs_broadcast_channel" character varying, "opened_bot_p_rs_broadcast_channel" character varying, CONSTRAINT "PK_64eb79c5aa967b6220267368532" PRIMARY KEY ("slack_workspace_id", "github_organization_id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "organization_settings"`);
    }

}
