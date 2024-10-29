import { SlackChannelInfo } from "./SlackChannelProvisioner";
import { CacheMetricsWrapper } from "./cache/CacheMetricsWrapper";

export const CHANNELS_CACHE = new CacheMetricsWrapper<SlackChannelInfo>("channels");