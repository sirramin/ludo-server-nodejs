const config = {
  redis: {
    prefixes: {
      roomsList: 'roomsList', // sorted set
      rooms: 'rooms:', // hash
      roomPlayers: 'roomPlayers:', // set
      users: 'users:', // hash
    }
  },
  gameMeta: {
    roomMin: 2,
    roomMax: 4,
    waitingTime: 3000, //TODO debug 30000
    kickTime: 30000,
    diceMaxTime: 3, //debug 10
    autoMoveMaxTime: 70, //debug 7
    manualMoveMaxTime: 70, //debug 7
    lightsAtStart: 4
  },
  tiles: {
    tileStarts: [1, 10, 19, 28],
    tilesStartEndLast: [[1, 36, 37, 39], [10, 9, 40, 42], [19, 18, 43, 45], [27, 30, 46, 48]],
  }
}

module.exports = config