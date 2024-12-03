import { DataSource } from "typeorm";
import { AppConfig } from "../app.config";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { OrganizationSettings } from "./entities/OrganizationSettings";

class OrgSettingsDataSource extends DataSource {
    constructor() {
        super({
            type: "postgres",
            host: AppConfig.OrgSettingsDB.DB_HOST,
            port: AppConfig.OrgSettingsDB.DB_PORT,
            username: AppConfig.OrgSettingsDB.DB_USERNAME,
            password: AppConfig.OrgSettingsDB.DB_PASSWORD,
            database: AppConfig.OrgSettingsDB.DB_NAME,
            entities: [OrganizationSettings],
            namingStrategy: new SnakeNamingStrategy(),
            synchronize: false,
            migrations: ["src/org-settings-db/migrations/*.ts"],
            migrationsRun: true,
            logging: false
        });
    }
}

export const OrgSettingsDB = new OrgSettingsDataSource();