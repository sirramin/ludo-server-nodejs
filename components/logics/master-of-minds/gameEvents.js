const _ = require('lodash')

module.exports = (io, socket, gameMeta, marketKey) => {
    const userId = socket.userInfo.userId
    const maxTime = 25
    const colors = {
        0: 'purple',
        1: 'blue',
        2: 'green',
        3: 'red',
        4: 'yellow',
        5: 'silver'
    }
    let freezeTime = [], stage, positions, remainingTime1, remainingTime2, correctCombination
    let matchMaking, roomId, methods, roomInfo, slot1Locked, slot2Locked, p1Finished, p2Finished, gameEnds

    const getAct = async (msg) => {
        const {act, data} = msg
        if (act === 'arrange')
            await arrange(data.combination)
        if (act === 'chat')
            await chat(data.msg)
        if (act === 'powerUp')
            await powerUp(data.powerUpCode)
    }

    const arrange = async (combination) => {
        await getInitialProperties()
        const playerNumber = findPlayerNumber()
        await methods.setProp('slot' + playerNumber + 'Locked', true)
        methods.sendGameEvents(24, 'slotLocked', {
            "player": playerNumber
        })
        // stage = await methods.incrProp('stage', 1)
        // methods.sendGameEvents(104, 'stageIncreased', stage)
        const result = await checkCombination(combination, playerNumber)
        await methods.sendEventToSpecificSocket(userId, 20, 'result', result)

        // const players = [positions[0].userId, positions[1].userId]
        // const gameStart = require('./gameStart')(roomId, players, positions, methods)
        // await checkGameEnds()
    }

    const powerUp = async (powerUpCode) => {
        if (powerUpCode === 3)
            increaseTime()
        if (powerUpCode === 1)
            vibration()
        if (powerUpCode === 5)
            doNotDecreaseCoin()
    }

    const increaseTime = async () => {

    }

    const checkCombination = async (userCombination, playerNumber) => {
        const common = _.intersection(correctCombination, userCombination)
        let displaced = 0, exact = 0
        common.forEach(async (item, index) => {
            if (correctCombination.indexOf(item) === userCombination.indexOf(item))
                exact++
            else
                displaced++
        })

        if (exact === 3)
            await playerFinished(playerNumber)

        return {
            displaced: displaced,
            exact: exact
        }
    }

    // const checkGameEnds = async () => {
    //     await getInitialProperties()
    //     if (slot1Locked && slot2Locked) {
    //         logger.info('p1Finished: ' + p1Finished + ' p2Finished: ' + p2Finished)
    //
    //         if (!p1Finished && !p2Finished) {
    //             await addStage()
    //         }
    //         else {
    //             gameEnds = true
    //             await methods.setProp('gameEnds', true)
    //             if (p1Finished && p2Finished)
    //                 methods.sendGameEvents(24, 'gameEnd', {
    //                     "draw": true
    //                 })
    //             if (p1Finished && !p2Finished)
    //                 methods.sendGameEvents(24, 'gameEnd', {
    //                     "winner": 1
    //                 })
    //             if (!p1Finished && p2Finished)
    //                 methods.sendGameEvents(24, 'gameEnd', {
    //                     "winner": 2
    //                 })
    //         }
    //         // if (p1Finished || p1Finished)
    //         //     await methods.deleteRoom(roomId)
    //     }
    // }

    // const addStage = async () => {
    //     await getInitialProperties()
    //     if (stage <= 30) {
    //         await methods.setProp('slot1Locked', false)
    //         await methods.setProp('slot2Locked', false)
    //         await methods.setProp('remainingTime1', maxTime)
    //         await methods.setProp('remainingTime2', maxTime)
    //         stage = await methods.incrProp('stage', 1)
    //         methods.sendGameEvents(104, 'stageIncreased', stage)
    //     }
    //     else if(stage > 30)
    //         await gameEndByStageLimit()
    // }

    // const gameEndByStageLimit = async () => {
    //     gameEnds = true
    //     await methods.setProp('gameEnds', true)
    //     methods.sendGameEvents(24, 'gameEnd', {
    //         "draw": true
    //     })
    //     // await methods.deleteRoom(roomId)
    // }


    const playerFinished = async (playerNumber) => {
        logger.info('playerNumber: ' + playerNumber)
        await methods.setProp('p' + playerNumber + 'Finished', true)
    }


    const getInitialProperties = async () => {
        //must be optimised and remove matchmaking
        matchMaking = require('../../realtime/matchMaking')(io, socket, gameMeta, marketKey)
        roomId = await matchMaking.findUserCurrentRoom()
        methods = require('../../realtime/methods')(io, gameMeta, roomId, marketKey)
        roomInfo = await methods.getAllProps()
        if (!marketKey) marketKey = JSON.parse(roomInfo['info']).marketKey
        if (roomInfo && roomInfo.hasOwnProperty('positions')) {
            correctCombination = JSON.parse(roomInfo['correctCombination'])
            remainingTime1 = parseInt(roomInfo['remainingTime1'])
            remainingTime2 = parseInt(roomInfo['remainingTime2'])
            positions = JSON.parse(roomInfo['positions'])
            slot1Locked = JSON.parse(roomInfo['slot1Locked'])
            slot2Locked = JSON.parse(roomInfo['slot2Locked'])
            p1Finished = JSON.parse(roomInfo['p1Finished'])
            p2Finished = JSON.parse(roomInfo['p2Finished'])
            gameEnds = JSON.parse(roomInfo['gameEnds'])
        }
    }

    const findPlayerNumber = () => {
        const userObj = _.find(positions, function (o) {
            return o.userId === userId
        })
        return userObj.player
    }

    const chat = (msg) => {
        methods.broadcast(socket, msg)
    }


    return ({
        getAct: getAct
    })

}