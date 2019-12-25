const {flatbuffers} = require('../../flatbuffers-lib')
const {Mench: {Text: {Str}}} = require('../schemas/str_generated')

const data = {}

data.stringBuf = (msg) => {
  const builder = new flatbuffers.Builder(0)
  const msgString = builder.createString(msg)
  Str.startStr(builder)
  Str.addData(builder, msgString)
  const object = Str.endStr(builder)
  builder.finish(object)
  return builder.asUint8Array()
}

module.exports = data
