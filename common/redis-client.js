// const redis = require("redis");
// const redisClient = redis.createClient()
// const asyncRedis = require("async-redis");
const redis = require('promise-redis')()

if (!redisClientAsync) {
    // redisClientAsync = process.env.docker ? redis.createClient({host: 'redis', port: 6378}): redis.createClient({host: 'localhost', port: 6379})
    const redisOptions = process.env.REDIS_URL ? process.env.REDIS_URL : ''
    redisClientAsync = redis.createClient(redisOptions)
}

redisClientAsync.on("error", function (err) {
    logger.log("Error " + err);
});

module.exports = redisClientAsync
