import { PullRequestCommentSnapshot } from "../../pr-events-handler/slack-api-ports";
import { CacheMetricsWrapper } from "../cache-metrics-wrapper/CacheMetricsWrapper";

export const COMMENTS_CACHE =
    new CacheMetricsWrapper<PullRequestCommentSnapshot>("comments");
