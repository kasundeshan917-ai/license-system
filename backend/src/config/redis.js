// Redis disabled for now - using memory store instead
const redis = {
    isEnabled: false,
    async get(key) { return null; },
    async set(key, value, options) { return null; },
    async del(key) { return null; },
    async exists(key) { return false; },
    async expire(key, seconds) { return null; },
    async incr(key) { return null; },
    async lpush(key, value) { return null; },
    async lrange(key, start, stop) { return []; },
};

module.exports = redis;