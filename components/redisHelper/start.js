const logicStart = require('../logics/gameStart')

const start = async (roomId) => {
  logicStart(roomId)
}

module.exports = start