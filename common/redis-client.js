// const redis = require("redis");
// const redisClient = redis.createClient()
// const asyncRedis = require("async-redis");
const redis = require('promise-redis')()
const redisClientAsync = redis.createClient()

redisClientAsync.on("error", function (err) {
    console.log("Error " + err);
});

module.exports = redisClientAsync
