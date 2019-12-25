const {flatbuffers} = require('../../flatbuffers-lib')
const {Mench: {Number: {Integ}}} = require('../schemas/int_generated')

const data = {}

data.integerBuf = (number) => {
  const builder = new flatbuffers.Builder(0)
  Integ.startInteg(builder)
  Integ.addData(builder, number)
  const object = Integ.endInteg(builder)
  builder.finish(object)
  return builder.asUint8Array()
}

module.exports = data
