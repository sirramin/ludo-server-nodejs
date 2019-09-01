const exp = {}

exp.setProp = async (roomId, field, value) => {
  await redisClient.hset(redisConfig.prefixes.rooms + roomId, field, value)
}

exp.setMultipleProps = async (...args) => {
  await redisClient.hmset(redisConfig.prefixes.rooms, ...args)
}

exp.getProp = async (field) => {
  const value = await redisClient.hget(redisConfig.prefixes.rooms, field)
  return JSON.parse(value)
}

exp.incrProp = async (field, number) => {
  return await redisClient.hincrby(redisConfig.prefixes.rooms, field, number)
}

exp.getAllProps = async () => {
  return await redisClient.hgetall(redisConfig.prefixes.rooms)
}

module.exports = exp