const {flatbuffers} = require('../../flatbuffers-lib')
const {Mench: {pos: {CurrentPosition, Positions}}} = require('../schemas/positions_generated')

const data = {}

data.positionBuf = (PositionsData) => {
  const builder = new flatbuffers.Builder(0)
  const posits = []
  for (const PositionData of PositionsData) {
    const userIdString = builder.createString(PositionData.userId)
    const usernameString = builder.createString(PositionData.username)
    CurrentPosition.startCurrentPosition(builder)
    CurrentPosition.addPlayer(builder, PositionData.player)
    CurrentPosition.addUserId(builder, userIdString)
    CurrentPosition.addUsername(builder, usernameString)
    const posit = CurrentPosition.endCurrentPosition(builder)
    posits.push(posit)
  }

  const data = Positions.createDataVector(builder, posits)
  Positions.startPositions(builder)
  Positions.addData(builder, data)
  const object = Positions.endPositions(builder)
  builder.finish(object)

  return builder.asUint8Array()
}

module.exports = data
