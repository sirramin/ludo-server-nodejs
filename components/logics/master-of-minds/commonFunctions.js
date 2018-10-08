module.exports = () => {
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

    return {
        sendPositions: sendPositions,
        addStage: addStage,
        checkGameEnds: checkGameEnds
    }
}