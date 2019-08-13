const Redis = require("ioredis")
const cluster = new Redis.Cluster([
  {
    host: process.env.REDIS1_host,
    port: parseInt(process.env.REDIS1_port),
  },
  {
    host: process.env.REDIS2_host,
    port: parseInt(process.env.REDIS2_port),
  }
]);

module.exports = cluster
