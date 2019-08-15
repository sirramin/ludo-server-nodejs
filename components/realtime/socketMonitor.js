const monitor = require('socket.io-monitor')
const {emitter} = monitor.bind(io, {server: false})
emitter.getState()
emitter.on('join', ({id, rooms}) => logger.info('socket id: ' + id + ' joins room: ' + rooms))