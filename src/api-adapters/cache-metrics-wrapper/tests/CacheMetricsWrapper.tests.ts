import { CacheMetricsWrapper } from "../CacheMetricsWrapper";
import { register } from "prom-client";

describe("CacheMetricsWrapper", () => {
    afterEach(() => {
        register.clear();
    });
    it("should set and get an item", async () => {
        const cache = new CacheMetricsWrapper("test");
        await cache.set("key1", "value1");
        expect(await cache.get("key1")).toBe("value1");
    });

    it("should delete an item", async () => {
        const cache = new CacheMetricsWrapper("test");
        await cache.set("key1", "value1");
        await cache.delete("key1");
        expect(await cache.get("key1")).toBeNull();
    });

    it("should update value for existing key", async () => {
        const cache = new CacheMetricsWrapper("test");
        await cache.set("key1", "value1");
        await cache.set("key1", "value2");
        expect(await cache.get("key1")).toBe("value2");
    });

    it("should handle deletion of non-existing item", async () => {
        const cache = new CacheMetricsWrapper("test");
        await cache.delete("non-existing-key");
    });
});
