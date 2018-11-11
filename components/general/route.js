const gameIdentifier = require('../../common/gameIdentifier').findGameName,
    gameMeta = require('../../common/gameIdentifier').getGameMeta,
    response = require('../../common/response'),
    router = require('express').Router(),
    serviceClass = require('./class/service-class')


module.exports = () => {

    /**
     * @api {get} /general/checkUpdate/:playerVersion checkUpdate
     * @apiName checkUpdate
     * @apiGroup general
     * @apiHeader {String} gameid
     * @apiParam {String} playerVersion
     * @apiSuccessExample (Success 1) {json} Success-Response:
     * {
    "code": 1,
    "message": "player has latest version"
    }
     * @apiSuccessExample (Success 2) {json} Success-Response:
      {
    "code": 2,
    "message": "player has not latest version but still can play",
    "data": {
        "marketUrl": "https://cafebazaar.ir/app/com.artagamestudio.moogy/?l=fa"
        }
    }
     * @apiSuccessExample (Success 3) {json} Success-Response:
     * {
    "code": 3,
    "message": "force update",
    "data": {
        "marketUrl": "https://cafebazaar.ir/app/com.artagamestudio.moogy/?l=fa"
        }
    }

     *
     * @apiError (Errors) 1 error checking for update
     */
    router.get('/checkUpdate/:playerVersion', gameIdentifier, async (req, res, next) => {
        const gameMeta = await require('../../common/gameIdentifier').getGameMeta(req.dbUrl)
        const {playerVersion} = req.params
        const service = new serviceClass(req.dbUrl)
        try {
            const updateStatus = await service.checkUpdateStatus(playerVersion, gameMeta)
            response(res, updateStatus.message, updateStatus.code, updateStatus.data)
        }
        catch (e) {
            logger.error(e)
            response(res, 'error checking for update', 1)
        }
    })

    return router
}