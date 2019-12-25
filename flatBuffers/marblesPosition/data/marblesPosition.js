const {flatbuffers} = require('../../flatbuffers-lib')
const {Mench: {MarblesPos: {Marbs3, MarblesPosition}}} = require('../schemas/marblesPosition_generated')

const data = {}

data.marblesPositionBuf = (marblesPosition) => {
  const builder = new flatbuffers.Builder(0)
  const marbs = []
  for (const value of marblesPosition) {
    Marbs3.startMarbs3(builder)
    Marbs3.addOne(builder, value[0])
    Marbs3.addTwo(builder, value[1])
    Marbs3.addThree(builder, value[2])
    const Marbs3Table = Marbs3.endMarbs3(builder)
    marbs.push(Marbs3Table)
  }
  const data = MarblesPosition.createDataVector(builder, marbs)
  MarblesPosition.startMarblesPosition(builder)
  MarblesPosition.addData(builder, data)
  const object = MarblesPosition.endMarblesPosition(builder)
  builder.finish(object)
  return builder.asUint8Array()
}

module.exports = data
