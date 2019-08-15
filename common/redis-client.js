const Redis = require("ioredis")
const nodes = process.env.docker ?
  [{
    host: process.env.REDIS1_host,
    port: parseInt(process.env.REDIS1_port),
  },
  {
    host: process.env.REDIS2_host,
    port: parseInt(process.env.REDIS2_port),
  }] :
  [{
      host: 'localhost',
      port: 6379,
    }]
const cluster = new Redis.Cluster();

module.exports = cluster
