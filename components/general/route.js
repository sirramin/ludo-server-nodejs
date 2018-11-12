const gameIdentifier = require('../../common/gameIdentifier'),
    response = require('../../common/response'),
    router = require('express').Router(),
    serviceClass = require('./class/service-class'),
    _ = require('lodash')


module.exports = () => {

    /**
     * @api {get} /general/checkUpdate/:playerVersion checkUpdate
     * @apiName checkUpdate
     * @apiGroup general
     * @apiHeader {String} gameid
     * @apiParam {String} playerVersion
     * @apiSuccessExample (Success 1) {json} Success-Response:
     * {
    "code": 2,
    "message": "player has latest version"
    }
     * @apiSuccessExample (Success 2) {json} Success-Response:
     {
    "code": 3,
    "message": "player has not latest version but still can play",
    "data": {
        "marketUrl": "https://cafebazaar.ir/app/com.artagamestudio.moogy/?l=fa"
        }
    }
     * @apiSuccessExample (Success 3) {json} Success-Response:
     * {
    "code": 4,
    "message": "force update",
    "data": {
        "marketUrl": "https://cafebazaar.ir/app/com.artagamestudio.moogy/?l=fa"
        }
    }
     *
     * @apiError (Errors) 1 error checking for update
     */
    router.get('/checkUpdate/:playerVersion', gameIdentifier.findGameName, async (req, res, next) => {
        const {playerVersion} = req.params
        const service = new serviceClass(req.dbUrl)
        try {
            const gameMeta = await gameIdentifier.getGameMeta(req.dbUrl)
            const updateStatus = await service.checkUpdateStatus(playerVersion, gameMeta)
            response(res, updateStatus.message, updateStatus.code, updateStatus.data)
        }
        catch (e) {
            logger.error(e)
            response(res, 'error checking for update', 1)
        }
    })

    /**
     * @api {get} /general/otherGames/list otherGames list
     * @apiName otherGamesList
     * @apiGroup general
     * @apiHeader {String} gameid
     * @apiSuccessExample (Success 1) {json} Success-Response:
     * {
    "code": 2,
    "message": "",
    "data": [
        {
            "gameId": "5baa2436f228252f48b23d8a",
            "name": "moogy",
            "imageUrl": "http://platfrom.artagamestudio.com/static/img/icons/test.png",
            "banner": "http://platfrom.artagamestudio.com/static/img/banners/test.jpg",
            "link": "https://cafebazaar.ir/app/com.artagamestudio.moogy/?l=fa",
            "clickCounterUrl": "http://platfrom.artagamestudio.com/general/clickCounter/space-looper"
        }
    ]
}*
     * @apiError (Errors) 1 error getting other games
     */
    router.get('/otherGames/list', gameIdentifier.findGameName, async (req, res, next) => {
        try {
            const gameMeta = await gameIdentifier.getGameMeta(req.dbUrl)
            response(res, '', 2, gameMeta.otherGames)
        }
        catch (e) {
            logger.error(e)
            response(res, 'error getting other games', 1)
        }
    })

    /**
     * @api {get} /general/otherGames/single otherGames single
     * @apiName otherGamesSingle
     * @apiGroup general
     * @apiHeader {String} gameid
     * @apiSuccessExample (Success 1) {json} Success-Response:
     * {
    "code": 2,
    "message": "",
    "data": {
        "gameId": "5baa2436f228252f48b23d8a",
        "name": "moogy",
        "imageUrl": "http://platfrom.artagamestudio.com/static/img/icons/test.png",
        "banner": "http://platfrom.artagamestudio.com/static/img/banners/test.jpg",
        "link": "https://cafebazaar.ir/app/com.artagamestudio.moogy/?l=fa",
        "clickCounterUrl": "http://localhost:3000/general/clickCounter/space-looper"
        }
    } *
     * @apiError (Errors) 1 error getting other games
     */
    router.get('/otherGames/single', gameIdentifier.findGameName, async (req, res, next) => {
        try {
            const gameMeta = await gameIdentifier.getGameMeta(req.dbUrl)
            response(res, '', 2, gameMeta.otherGames[_.random(0, gameMeta.otherGames.length - 1)])
        }
        catch (e) {
            logger.error(e)
            response(res, 'error getting other games', 1)
        }
    })

    /**
     * @api {get} /general/clickCounter/:gameName clickCounter
     * @apiName clickCounter
     * @apiGroup general
     * @apiError (Errors) 1 error adding count
     */
    router.get('/clickCounter/:gameName', async (req, res, next) => {
        const {gameName} = req.params
        try {
            const link = await gameIdentifier.increaseClick(gameName)
            response(res, '', 2, {marketUrl: link.marketUrl, link: link.link})
        }
        catch (e) {
            logger.error(e)
            response(res, 'error adding count', 1)
        }
    })

    return router
}