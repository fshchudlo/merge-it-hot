import { Column, Entity, PrimaryColumn } from "typeorm";


@Entity()
export class OrganizationSettings {
    @PrimaryColumn()
    slackWorkspaceId: string;

    @PrimaryColumn()
    githubOrganizationId: string;

    @Column("text", { array: true, default: "{}" })
    defaultChannelParticipants: string[];

    @Column({ type: "varchar", nullable: true })
    openedPRsBroadcastChannel: string | null;

    @Column({ type: "varchar", nullable: true })
    openedBotPRsBroadcastChannel: string | null;
}
