module.exports = () => {

    let stage, positions, remainingTime1, remainingTime2, correctCombination
    let matchMaking, roomId, methods, roomInfo, slot1Locked, slot2Locked, p1Finished, p2Finished

    const checkGameEnds = async () => {
        await getInitialProperties()
        if (slot1Locked && slot2Locked) {
            logger.info('p1Finished: ' + p1Finished + ' p2Finished: ' + p2Finished)
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

            if (!p1Finished && !p2Finished) {
                await addStage()
            }

            if (p1Finished || p1Finished)
                await methods.deleteRoom(roomId)
        }
    }

    const addStage = async () => {
        await getInitialProperties()
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
        await methods.deleteRoom(roomId)
        methods.sendGameEvents(24, 'gameEnd', {
            "draw": true
        })
    }

    const getInitialProperties = async () => {
        //must be optimised and remove matchmaking
        matchMaking = require('../../realtime/matchMaking')(io, socket, gameMeta, marketKey)
        roomId = await matchMaking.findUserCurrentRoom()
        methods = require('../../realtime/methods')(io, gameMeta, roomId, marketKey)
        roomInfo = await methods.getAllProps()
        if (!marketKey) marketKey = JSON.parse(roomInfo['info']).marketKey
        correctCombination = JSON.parse(roomInfo['correctCombination'])
        remainingTime1 = parseInt(roomInfo['remainingTime1'])
        remainingTime2 = parseInt(roomInfo['remainingTime2'])
        positions = JSON.parse(roomInfo['positions'])
        slot1Locked = JSON.parse(roomInfo['slot1Locked'])
        slot2Locked = JSON.parse(roomInfo['slot2Locked'])
        p1Finished = JSON.parse(roomInfo['p1Finished'])
        p2Finished = JSON.parse(roomInfo['p2Finished'])
    }

    return {
        sendPositions: sendPositions,
        addStage: addStage,
        checkGameEnds: checkGameEnds
    }
}