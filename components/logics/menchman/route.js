const route = require('express').Router();


module.exports = (io) => {
    route.post('/5b39d163afff3d2cf7833f6e/start', async (req, res, next) => {
        const roomId = req.body.roomId
        const players = JSON.parse(req.body.players)
        const gameMeta = JSON.parse(req.body.gameMeta)
        const marketKey = req.body.marketKey
        const methods = require('../../realtime/methods')(io, gameMeta, roomId, marketKey)
        const gameStart = require('./gameStart')(roomId, players, methods)
        gameStart.sendPositions()
    })

    // route.post('/5b39d163afff3d2cf7833f6e/event', async (req, res, next) => {
    //     const roomId = req.body.roomId
    //     const players = JSON.parse(req.body.players)
    //     const gameMeta = JSON.parse(req.body.gameMeta)
    //     const methods = require('../../realtime/methods')(io, gameMeta, roomId)
    //     const gameStart = require('./gameEvents')(roomId, players, methods)
    // })

    return route
}