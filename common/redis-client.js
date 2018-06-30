const asyncRedis = require("redis");
let redisClient
if (process.env.docker) {
    console.info('redis on the Docker')
    redisClient = asyncRedis.createClient(6379, "redis")
}
else {
    console.info('redis on local')
    redisClient = asyncRedis.createClient()
}
module.exports = redisClient
