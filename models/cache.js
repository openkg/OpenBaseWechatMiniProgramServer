const Redis = require('ioredis');
const config = require('config');
const assert = require('assert');

let _cache;

function initCache() {
    if (_cache) {
        console.warn("Trying to init redis cache again!");
        return _cache;
    }
    //console.log(config.get("redisServer"));
    _cache = new Redis.Cluster(config.get("redisServer"));

    console.log("Cache initialized - connected to: " + JSON.stringify(config.get("redisServer")));
    
    return _cache;
}

function getCache() {
    assert.ok(_cache, "redis cache has not been initialized. Please called init first.");
    return _cache;
}

module.exports = {
    initCache,
    getCache
};