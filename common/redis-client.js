// const redis = require("redis");
// const redisClient = redis.createClient()
const asyncRedis = require("async-redis");
const redisClientAsync = asyncRedis.createClient()

redisClientAsync.on("error", function (err) {
    console.log("Error " + err);
});

module.exports = redisClientAsync
