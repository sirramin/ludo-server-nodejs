// const _ = require('lodash'),
//     rpn = require('request-promise-native'),
//     Leaderboard = require('leaderboard-promise'),
//     asyncRedis = require("async-redis"),
//     redisClient = asyncRedis.createClient(),
//     lb = new Leaderboard('master-of-minds:otp', redisClient);
//
// module.exports = (router) => {
//
//     router.get('/addScore', async (req, res, next) => {
//         res.send('done')
//
//         const addUser = async () => {
//             let options = {
//                 method: 'POST',
//                 uri: 'http://localhost:4000/user/signup',
//                 json: true
//             }
//             for (let i = 0; i <= 30000; i++) {
//                 options.body = {
//                     password: 'rezapishro',
//                     phoneNumber: _.random(0, 9999999),
//                     username: 'sirramin' + _.random(0, 9999999)
//                 }
//                 const res = await rpn.post(options)
//                 addScore(res.token)
//             }
//         }
//
//         const addScore = async (token) => {
//             let options = {
//                 method: 'POST',
//                 uri: 'http://localhost:4000/leaderboard/gameResult',
//                 json: true
//             }
//             options.headers = {
//                 token: token
//             }
//             options.body = {
//                 "league": 2,
//                 "isWinner": true
//             }
//             await rpn.post(options)
//         }
//
//         const addScoreDirect = async () => {
//             for (let i = 0; i <= 500000; i++) {
//                 const username = 'sirramin' + _.random(0, 9999999)
//                 userInfo = {
//                     "username": username,
//                     "win": _.random(0, 1000),
//                     "lose": _.random(0, 1000)
//                 }
//                 await lb.add(JSON.stringify(userInfo), _.random(1, 99999))
//                 await redisClient.hmset('users', username, JSON.stringify(userInfo))
//             }
//         }
//
//         await addScoreDirect()
//     })
//
//
//     return router
// }
//
