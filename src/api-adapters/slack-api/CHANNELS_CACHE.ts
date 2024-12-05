import { CacheMetricsWrapper } from "../cache-metrics-wrapper/CacheMetricsWrapper";
import { SlackChannelInfo } from "../../pr-events-handler/slack-api-ports";

export const CHANNELS_CACHE = new CacheMetricsWrapper<SlackChannelInfo>(
    "channels",
);
