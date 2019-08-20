const config = {
  redis: {
    prefixes: {
      roomsList: 'rooms:roomsList',
      rooms: 'rooms:',
      roomPlayers: 'roomPlayers:',
      users: 'users:'
    }
  },
  gameMeta: {
    roomMin: 2,
    roomMax: 4,
    waitingTime: 60,
    kickTime: 30
  }
}

module.exports = config