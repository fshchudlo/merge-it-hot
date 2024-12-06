import { SendMessageArguments } from "./SendMessageArguments";

export interface SlackTargetedChannel {
    readonly channelInfo: SlackChannelInfo;

    addBookmark(options: AddBookmarkArguments): Promise<void>;

    setTopic(topic: string): Promise<void>;

    inviteToChannel(options: InviteToChannelArguments): Promise<void>;

    kickFromChannel(options: KickFromChannelArguments): Promise<void>;

    closeChannel(): Promise<void>;

    sendMessage(options: SendMessageArguments): Promise<void>;

    deleteMessage(messageId: string): Promise<void>;

    findLatestPullRequestCommentSnapshot(
        commentId: number | string
    ): Promise<PullRequestCommentSnapshot | null>;
}

export type SlackChannelInfo = {
    id: string;
    name: string;
};

export type PullrequestCommentSnapshotInSlackMetadata = {
    resolvedDate?: number;
    commentId: string;
    commentParentId?: string;
};
export type PullRequestCommentSnapshot =
    PullrequestCommentSnapshotInSlackMetadata & {
    slackMessageId: string;
    slackThreadId?: string;
};
export type AddBookmarkArguments = {
    link: string;
    title: string;
    emoji?: string;
};
export type InviteToChannelArguments = {
    force: boolean;
    users: string[];
};
export type KickFromChannelArguments = {
    users: string[];
};