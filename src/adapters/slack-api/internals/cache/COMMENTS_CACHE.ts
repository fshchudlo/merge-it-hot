import { PullRequestCommentSnapshot } from "../../../../web-app/notification-handlers/ports/SlackTargetedChannel";
import { CacheMetricsWrapper } from "./cache-metrics-wrapper/CacheMetricsWrapper";

export const COMMENTS_CACHE = new CacheMetricsWrapper<PullRequestCommentSnapshot>("comments");
