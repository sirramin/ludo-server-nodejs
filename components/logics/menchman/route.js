const router = require('express').Router()

module.exports = () => {

    router.get('/5b39d163afff3d2cf7833f6e/start', async (req, res, next) => {
        const {roomId, players} = req.headers
        const gameStart = require('gameStart')(roomId, players)
        gameStart.sendPositions()

    })

    return router
}