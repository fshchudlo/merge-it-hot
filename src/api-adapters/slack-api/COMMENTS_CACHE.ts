import { PullRequestCommentSnapshot } from "../../event-handlers/slack-api-ports";
import { CacheMetricsWrapper } from "../cache-metrics-wrapper/CacheMetricsWrapper";

export const COMMENTS_CACHE =
    new CacheMetricsWrapper<PullRequestCommentSnapshot>("comments");
