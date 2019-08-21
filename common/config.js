const config = {
  redis: {
    prefixes: {
      roomsList: 'rooms:roomsList', // sorted set
      rooms: 'rooms:', // hash
      roomPlayers: 'roomPlayers:', // set
      users: 'users:'
    }
  },
  gameMeta: {
    roomMin: 2,
    roomMax: 4,
    waitingTime: 60000,
    kickTime: 30
  }
}

module.exports = config