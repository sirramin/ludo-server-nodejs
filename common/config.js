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
    waitingTime: 15000, //TODO debug 30000
    kickTime: 30000,
    diceMaxTime: 10, //debug 10
    autoMoveMaxTime: 7, //debug 7
    manualMoveMaxTime: 7, //debug 7
    lightsAtStart: 4
  },
  tiles: {
    tileStarts: [1, 10, 19, 28],
    tilesStartEndLast: [[1, 36, 37, 39], [10, 9, 40, 42], [19, 18, 43, 45], [27, 30, 46, 48]],
  },
}

module.exports = config