import client, { Counter, Gauge } from "prom-client";
import { createCache } from "cache-manager";
import Keyv from "keyv";

export class CacheMetricsWrapper<T> {
    private readonly cache: ReturnType<typeof createCache>;
    private readonly utilizedCacheSizeGauge: Gauge;
    private readonly cacheHitsCounter: Counter;
    private readonly cacheMissesCounter: Counter;
    private readonly store: Keyv<T>;

    constructor(metricsNamePrefix: string) {
        this.store = new Keyv<T>();
        this.cache = createCache({ stores: [this.store] });
        this.cacheHitsCounter = new client.Counter({
            name: `${metricsNamePrefix}_cache_hits`,
            help: "Successful cache hits counter"
        });
        this.cacheMissesCounter = new client.Counter({
            name: `${metricsNamePrefix}_cache_misses`,
            help: "Missed cache hits counter"
        });
        this.utilizedCacheSizeGauge = new client.Gauge({
            name: `${metricsNamePrefix}_cache_utilized_size`,
            help: "Utilized cache size"
        });
    }

    async set(key: string, value: T): Promise<void> {
        await this.cache.set(key, value);
        this.utilizedCacheSizeGauge.inc();
    }

    async wrap(key: string, func: () => T | Promise<T>): Promise<T | null> {
        const value = await this.cache.wrap(key, func);
        this.utilizedCacheSizeGauge.inc();
        return value;
    }

    async get(key: string): Promise<T | null> {
        const value = await this.cache.get<T>(key);
        value ? this.cacheHitsCounter.inc() : this.cacheMissesCounter.inc();
        return value;
    }

    async delete(key: string): Promise<void> {
        await this.cache.del(key);
        this.utilizedCacheSizeGauge.dec();
    }

    async clear(): Promise<void> {
        await this.cache.clear();
        this.utilizedCacheSizeGauge.set(0);
    }

    async deleteWhere(keyPredicate: (k: string) => boolean) {
        for (const key of (<any>this.store.opts.store).keys()) {
            const clearKey = key.replace((<any>this.store.opts.store).namespace + ":", "");
            if (keyPredicate(clearKey)) {
                await this.cache.del(clearKey);
                this.utilizedCacheSizeGauge.dec();
            }
        }
    }
}
