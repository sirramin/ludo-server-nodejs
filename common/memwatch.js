// const memwatch = require('memwatch-next')
// memwatch.on('leak', function (info) {
//     console.log('leak' + JSON.stringify(info))
// })



// const EventEmitter = require('events');
//
// class MyEmitter extends EventEmitter {}
//
// const myEmitter = new MyEmitter();
// myEmitter.on('event', () => {
//     console.log('an event occurred!');
// });

// memwatch.on('stats', function (stats) {
//     console.log(('stats' + JSON.stringify(stats)))
// })

// module.exports = logger




// require('v8-profiler')

// It is important to use named constructors (like the one below), otherwise
// the heap snapshots will not produce useful outputs for you.
// function LeakingClass() {
// }
//
// let leaks = []
// setInterval(function() {
//     for (var i = 0; i < 100; i++) {
//         leaks.push(new LeakingClass);
//     }
//
//     console.error('Leaks: %d', leaks.length)
// }, 1000)