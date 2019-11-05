const config = {
  redis: {
    prefixes: {
      roomsList: 'roomsList', // sorted set
      rooms: 'rooms:', // hash
      roomPlayers: 'roomPlayers:', // set
      users: 'users:'
    }
  },
  gameMeta: {
    roomMin: 2,
    roomMax: 4,
    waitingTime: 6000,
    kickTime: 30000,
    timerMaxTime: 7,
    lightsAtStart: 4
  }
}

module.exports = config