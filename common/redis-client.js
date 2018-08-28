// const redis = require("redis");
// const redisClient = redis.createClient()
// const asyncRedis = require("async-redis");
const redis = require('promise-redis')()

if (!redisClientAsync)
    redisClientAsync = redis.createClient()


redisClientAsync.on("error", function (err) {
    logger.log("Error " + err);
});

module.exports = redisClientAsync
