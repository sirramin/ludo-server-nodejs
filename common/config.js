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
    waitingTime: 3000,
    kickTime: 30000
  }
}

module.exports = config