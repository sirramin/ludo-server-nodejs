const {flatbuffers} = require('../../flatbuffers-lib')
const {Mench: {Arrs: {Arr}}} = require('../schemas/arr_generated')

const data = {}

data.arrayBuf = (lights) => {
  const builder = new flatbuffers.Builder(0)
  const data = Arr.createDataVector(builder, lights)
  Arr.startArr(builder)
  Arr.addData(builder, data)
  const object = Arr.endArr(builder)
  builder.finish(object)
  return builder.asUint8Array()
}

module.exports = data
