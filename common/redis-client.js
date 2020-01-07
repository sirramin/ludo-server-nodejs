const Redis = require("ioredis")
const redisAdapter = require('socket.io-redis')
const {cluster} = require('./config')

let redis
if (!process.env.docker) {
  redis = new Redis()
  io.adapter(redisAdapter(redis))
} else {
  const port = parseInt(process.env.REDIS_PORT)
  // redis = new Redis(process.env.REDIS_URL)
  // io.adapter(redisAdapter(process.env.REDIS_URL))

  redis = new Redis.Cluster([
    {
      // host: process.env.REDIS_URL,
      host: cluster.node1,
      port,
    },
    {
      host: cluster.node2,
      port,
    }
  ])

  io.adapter(redisAdapter({
    pubClient: redis, //TODO maybe must be 2 instances
    subClient: redis
  }))

}


module.exports = redis
