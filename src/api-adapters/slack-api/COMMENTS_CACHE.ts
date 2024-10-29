import { PullRequestCommentSnapshot } from "../../pr-events-handler/slack-api-ports";
import { CacheMetricsWrapper } from "./cache/CacheMetricsWrapper";

export const COMMENTS_CACHE = new CacheMetricsWrapper<PullRequestCommentSnapshot>("comments");