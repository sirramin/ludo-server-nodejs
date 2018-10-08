const _ = require('lodash')
const async = require('async')

module.exports = (roomId, players, roomPlayersWithNames, methods) => {
    const maxTime = 25
    const colors = {
        0: 'purple',
        1: 'blue',
        2: 'green',
        3: 'red',
        4: 'yellow',
        5: 'silver'
    }
    let freezeTime = [], stage, positions, remainingTime1, remainingTime2, slot1Locked, slot2Locked, p1Finished, p2Finished

    const sendPositions = async () => {
        positions = roomPlayersWithNames
        players.forEach(async (item, index) => {
            const playerNumber = (index + 1)
            await methods.sendEventToSpecificSocket(item, 202, 'yourPlayerNumber', playerNumber)
        })
        const correctCombination = makeCombination()
        await methods.setMultipleProps(...['positions', JSON.stringify(positions), 'correctCombination', JSON.stringify(correctCombination),
            'remainingTime1', maxTime, 'remainingTime2', maxTime, 'stage', 1, 'slot1Locked', false, 'slot2Locked', false, 'p1Finished', false, 'p2Finished', false])
        methods.sendGameEvents(101, 'positions', positions)
        methods.sendGameEvents(102, 'correctCombination', correctCombination) // must be commented
        // async.parallel([
        timerCounter1()
        timerCounter2()
        // ])
    }

    const makeCombination = () => {
        const arr = []
        while (arr.length < 3) {
            const randomIndex = _.random(0, 5)
            // const randomColor = colors[randomIndex]
            if (arr.indexOf(randomIndex) === -1)
                arr.push(randomIndex)
        }
        return arr
    }

    const timerCounter1 = () => {
        const timerInterval = setInterval(async () => {
            const slot1Locked = JSON.parse(await methods.getProp('slot1Locked'))
            slot2Locked = JSON.parse(await methods.getProp('slot2Locked'))

            if (remainingTime1 === 0) {
                await methods.setProp('slot1Locked', true)
            }

            if (slot1Locked && slot2Locked)
                await checkGameEnds()
                // await addStage()

            if (!slot1Locked)
                remainingTime1 = await methods.incrProp('remainingTime1', -1)

            logger.info('roomId: ' + roomId + ' remainingTime1: ' + remainingTime1)
            if (remainingTime1 < -5) {
                clearInterval(timerInterval)
                await methods.deleteRoom(roomId)
            }

        }, 1000)
    }

    const timerCounter2 = () => {
        const timerInterval = setInterval(async () => {
            if (!slot2Locked)
                remainingTime2 = await methods.incrProp('remainingTime2', -1)

            logger.info('roomId: ' + roomId + ' remainingTime2: ' + remainingTime2)
            if (remainingTime2 < -5) {
                clearInterval(timerInterval)
                await methods.deleteRoom(roomId)
            }
            if (remainingTime2 === 0) {
                await methods.setProp('slot2Locked', true)
                // await addStage()
            }
        }, 1000)
    }




    // const checkGameEnds = async () => {
    //     await getInitialProperties()
    //     if (slot1Locked && slot2Locked) {
    //         logger.info('p1Finished: ' + p1Finished + ' p2Finished: ' + p2Finished)
    //         if (p1Finished && p2Finished)
    //             methods.sendGameEvents(24, 'gameEnd', {
    //                 "draw": true
    //             })
    //         if (p1Finished && !p2Finished)
    //             methods.sendGameEvents(24, 'gameEnd', {
    //                 "winner": 1
    //             })
    //         if (!p1Finished && p2Finished)
    //             methods.sendGameEvents(24, 'gameEnd', {
    //                 "winner": 2
    //             })
    //
    //         if (!p1Finished && !p2Finished) {
    //             await addStage()
    //         }
    //
    //         if (p1Finished || p1Finished)
    //             await methods.deleteRoom(roomId)
    //     }
    // }

    const gameEndByStageLimit = async () => {
        await methods.deleteRoom(roomId)
        methods.sendGameEvents(24, 'gameEnd', {
            "draw": true
        })
    }

    const getInitialProperties = async () => {
        const roomInfo = await methods.getAllProps()
        positions = JSON.parse(roomInfo['positions'])
        stage = JSON.parse(roomInfo['stage'])
    }

    return {
        sendPositions: sendPositions,
        // addStage: addStage,
        checkGameEnds: checkGameEnds
    }
}