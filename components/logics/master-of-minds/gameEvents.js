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
    let positions, remainingTime1, remainingTime2, correctCombination
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
        await getInitialProperties()

        if (powerUpCode === 3)
            await increaseTime()
        if (powerUpCode === 1)
            await vibration()
        if (powerUpCode === 5)
            await doNotDecreaseCoin()
    }

    const increaseTime = async () => {
        const playerNumber = findPlayerNumber()
        if (playerNumber === 1) {
            remainingTime1 = await methods.incrProp('remainingTime1', 10)
            logger.info('user ' + playerNumber + ' timer increased to ' + remainingTime1)
        }
        else {
            remainingTime2 = await methods.incrProp('remainingTime2', 10)
        }

        logger.info('roomId: ' + roomId + ' remainingTime' + playerNumber + ': ' + remainingTime1)
    }

    const vibration = async () => {
        await methods.sendEventToSpecificSocket(findOtherPlayerUserId(), 11, 'vibrate')
    }

    const doNotDecreaseCoin = async () => {
        const playerNumber = findPlayerNumber()
        await methods.setProp('doNotDecreaseCoinPlayer' + playerNumber, true)
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

    const findOtherPlayerUserId = () => {
        const playerNumber = findPlayerNumber()
        const otherPlayerNumber = playerNumber === 1 ? 2 : 1
        const userObj = _.find(positions, function (o) {
            return o.player === otherPlayerNumber
        })
        return userObj.userId
    }

    const chat = (msg) => {
        methods.broadcast(socket, msg)
    }


    return ({
        getAct: getAct
    })

}