const _ = require('lodash'),
    redisClient = require('../../common/redis-client')

const maxTime = 25
let stage, positions, remainingTime1, remainingTime2, slot1Locked, slot2Locked, p1Finished, p2Finished, gameEnds

module.exports.handler = async (roomId, methods) => {
    const players = await redisClient.hget('master-of-minds:rooms:'+roomId, 'players')
    gameStart = require('./gameStart')(roomId)
    gameStart.timerCounter1(methods)
    gameStart.timerCounter2(methods)

}

const timerCounter1 = (methods) => {
    const timerInterval = setInterval(async () => {
        if (!gameEnds)
            await getInitialProperties()

        if (gameEnds) {
            clearInterval(timerInterval)
            if (p1Finished || p1Finished)
                await methods.deleteRoom(roomId)
        }

        if (remainingTime1 === 0) {
            await methods.setProp('slot1Locked', true)
        }

        if (slot1Locked && slot2Locked && !gameEnds)
            await checkGameEnds()

        if (!slot1Locked)
            remainingTime1 = await methods.incrProp('remainingTime1', -1)

        logger.info('roomId: ' + roomId + ' remainingTime1: ' + remainingTime1)

    }, 1000)
}

const timerCounter2 = (methods) => {
    const timerInterval = setInterval(async () => {

        if (gameEnds)
            clearInterval(timerInterval)

        if (!slot2Locked)
            remainingTime2 = await methods.incrProp('remainingTime2', -1)

        logger.info('roomId: ' + roomId + ' remainingTime2: ' + remainingTime2)
        if (remainingTime2 < -5) {
            clearInterval(timerInterval)
            await methods.deleteRoom(roomId)
        }
        if (remainingTime2 === 0 && !gameEnds) {
            await methods.setProp('slot2Locked', true)
        }
    }, 1000)
}

const checkGameEnds = async (methods) => {
    await getInitialProperties()
    if (slot1Locked && slot2Locked) {
        logger.info('p1Finished: ' + p1Finished + ' p2Finished: ' + p2Finished)

        if (!p1Finished && !p2Finished) {
            await addStage()
        }
        else {
            gameEnds = true
            await methods.setProp('gameEnds', true)
            if (p1Finished && p2Finished)
                methods.sendGameEvents(24, 'gameEnd', {
                    "draw": true
                })
            if (p1Finished && !p2Finished)
                methods.sendGameEvents(24, 'gameEnd', {
                    "winner": 1
                })
            if (!p1Finished && p2Finished)
                methods.sendGameEvents(24, 'gameEnd', {
                    "winner": 2
                })

            await deletePlayersRoomAfterGame()
        }
    }
}

const addStage = async (methods) => {
    if (stage <= 30) {
        await methods.setProp('slot1Locked', false)
        await methods.setProp('slot2Locked', false)
        await methods.setProp('remainingTime1', maxTime)
        await methods.setProp('remainingTime2', maxTime)
        stage = await methods.incrProp('stage', 1)
        methods.sendGameEvents(104, 'stageIncreased', stage)
    }
    else if (stage > 30)
        await gameEndByStageLimit()
}

const gameEndByStageLimit = async () => {
    gameEnds = true
    await methods.setProp('gameEnds', true)
    methods.sendGameEvents(24, 'gameEnd', {
        "draw": true
    })
    await methods.deleteRoom(roomId)
}

const getInitialProperties = async () => {
    const roomInfo = await methods.getAllProps()
    if (roomInfo) {
        positions = JSON.parse(roomInfo['positions'])
        stage = JSON.parse(roomInfo['stage'])
        slot1Locked = JSON.parse(roomInfo['slot1Locked'])
        slot2Locked = JSON.parse(roomInfo['slot2Locked'])
        p1Finished = JSON.parse(roomInfo['p1Finished'])
        p2Finished = JSON.parse(roomInfo['p2Finished'])
        gameEnds = JSON.parse(roomInfo['gameEnds'])
    }
}

const findUserId = () => {
    const userObj = _.find(positions, function (o) {
        return o.player === currentPlayer
    })
    return userObj.userId
}

const getInitialProperties = async (methods) => {
    const roomInfo = await methods.getAllProps()
    positions = JSON.parse(roomInfo['positions'])
}


