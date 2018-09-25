const _ = require('lodash')
const async = require('async')

module.exports = (roomId, players, roomPlayersWithNames, methods) => {
    const maxTime = 25
    const colors = ['purple', 'blue', 'green', 'red', 'yellow', 'silver']
    let freezeTime = [], stage, positions, remainingTime1, remainingTime2

    const sendPositions = async () => {
        await methods.setProp('remainingTime', maxTime)
        positions = roomPlayersWithNames
        players.forEach(async (item, index) => {
            const playerNumber = (index + 1)
            await methods.sendEventToSpecificSocket(item, 202, 'yourPlayerNumber', playerNumber)
        })
        await methods.setMultipleProps(...['positions', JSON.stringify(positions)])
        methods.sendGameEvents(101, 'positions', positions)\
        async.parallel([
            timerCounter1(),
            timerCounter2()
        ])
    }

    const timerCounter1 = () => {
        const timerInterval = setInterval(async () => {
            remainingTime1 = await methods.incrProp('remainingTime1', -1)
            logger.info('roomId: '+ roomId + ' remainingTime: ' + remainingTime1)
            if (remainingTime1 < -1 && positions.length === 1) {
                clearInterval(timerInterval)
                await methods.deleteRoom(roomId)
            }
            if (remainingTime1 === 0) {
                await addStage()
            }
        }, 1000)
    }

    const timerCounter2 = () => {
        const timerInterval = setInterval(async () => {
            remainingTime2 = await methods.incrProp('remainingTime2', -1)
            logger.info('roomId: '+ roomId + ' remainingTime: ' + remainingTime2)
            if (remainingTime2 < -1 || positions.length === 1) {
                clearInterval(timerInterval)
                await methods.deleteRoom(roomId)
            }
            if (remainingTime2 === 0) {
                await addStage()
            }
        }, 1000)
    }


    const addStage = async () => {
        if (remainingTime1 === 0 && remainingTime2 === 0) {
            await getInitialProperties()
            if(stage <= 30) {
                await methods.setProp('remainingTime1', maxTime)
                await methods.setProp('remainingTime2', maxTime)
                await methods.incrProp('stage', 1)
                methods.sendGameEvents(104, 'stageIncreased')
            }
            else
                await gameEnd(true)
        }
    }

    const gameEnd = async (draw) => {

    }

    const getInitialProperties = async () => {
        const roomInfo = await methods.getAllProps()
        positions = JSON.parse(roomInfo['positions'])
        stage = JSON.parse(roomInfo['stage'])
    }

    return {
        sendPositions: sendPositions
    }
}