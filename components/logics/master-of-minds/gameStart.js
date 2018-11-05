const _ = require('lodash')
// const async = require('async')
const leaderboardService = require('../../leaderboard/class/service-class')

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
    let stage, positions, remainingTime1, remainingTime2, slot1Locked, slot2Locked, p1Finished,
        p2Finished, gameEnds

    const sendPositions = async () => {
        positions = roomPlayersWithNames
        players.forEach(async (item, index) => {
            const playerNumber = (index + 1)
            await methods.sendEventToSpecificSocket(item, 202, 'yourPlayerNumber', playerNumber)
        })
        const correctCombination = makeCombination()
        await methods.setMultipleProps(...['positions', JSON.stringify(positions), 'correctCombination', JSON.stringify(correctCombination),
            'remainingTime1', maxTime, 'remainingTime2', maxTime, 'stage', 1, 'slot1Locked', false, 'slot2Locked', false, 'p1Finished', false, 'p2Finished', false, 'gameEnds', false])
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
            // await addStage()

            if (!slot1Locked)
                remainingTime1 = await methods.incrProp('remainingTime1', -1)

            // logger.info('roomId: ' + roomId + ' remainingTime1: ' + remainingTime1)

            if (remainingTime1 < -2) {
                clearInterval(timerInterval)
                await methods.deleteRoom(roomId)
            }

        }, 1000)
    }

    const timerCounter2 = () => {
        const timerInterval = setInterval(async () => {

            if (gameEnds)
                clearInterval(timerInterval)

            // if (gameEnds === undefined)
            //     await getInitialProperties()

            if (!slot2Locked)
                remainingTime2 = await methods.incrProp('remainingTime2', -1)

            // logger.info('roomId: ' + roomId + ' remainingTime2: ' + remainingTime2)
            if (remainingTime2 < -2) {
                clearInterval(timerInterval)
                await methods.deleteRoom(roomId)
            }
            if (remainingTime2 === 0 && !gameEnds) {
                await methods.setProp('slot2Locked', true)
            }
        }, 1000)
    }


    const checkGameEnds = async () => {
        await getInitialProperties()
        if (slot1Locked && slot2Locked) {
            // logger.info('p1Finished: ' + p1Finished + ' p2Finished: ' + p2Finished)

            if (!p1Finished && !p2Finished) {
                await addStage()
            }
            else {
                gameEnds = true
                await methods.setProp('gameEnds', true)
                let winnerNumner, loserNumber
                if (p1Finished && p2Finished)
                    methods.sendGameEvents(24, 'gameEnd', {
                        "draw": true
                    })
                if (p1Finished && !p2Finished) {
                    winnerNumner = 1
                    loserNumber = 2
                    methods.sendGameEvents(24, 'gameEnd', {
                        "winner": 1
                    })
                }
                if (!p1Finished && p2Finished) {
                    winnerNumner = 2
                    loserNumber = 1
                    methods.sendGameEvents(24, 'gameEnd', {
                        "winner": 2
                    })
                }
                const winnerId = findUserId(winnerNumner)
                await methods.addToLeaderboard(winnerId, true)
                await methods.addToLeaderboard(findUserId(loserNumber), false)

                const roomInfo = await methods.getProp('info')
                const leagueId = roomInfo.leagueId
                await methods.givePrize(winnerId, leagueId)

                await deletePlayersRoomAfterGame()
                await refundCoin(loserNumber)
            }
        }
    }

    const refundCoin = async (loserNumber) => {
        const hasDoNotDecrease = await methods.getProp('doNotDecreaseCoinPlayer' + loserNumber)
        if (hasDoNotDecrease) {
            const roomInfo = await methods.getProp('info')
            const leagueId = roomInfo.leagueId
            const marketKey = roomInfo.marketKey
            const market = marketKey.slice(marketKey.indexOf("users:") + 6, marketKey.length)
            const serviceObj = new leaderboardService('master-of-minds', market)
            const leagues = await serviceObj.getLeagues()
            const coin = leagues[leagueId - 1].entranceCoins
            const query = require('../../user/query')('master-of-minds')
            await query.updateUser({_id: findUserId(loserNumber)}, {$inc: {coin: coin}})
        }
    }

    const deletePlayersRoomAfterGame = async () => {
        await methods.deleteUserRoom(findUserId(1))
        await methods.deleteUserRoom(findUserId(2))
    }

    const addStage = async () => {
        // await getInitialProperties()
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
        await deletePlayersRoomAfterGame()
    }

    const getInitialProperties = async () => {
        const roomInfo = await methods.getAllProps()
        if (roomInfo && roomInfo.hasOwnProperty('positions')) {
            positions = JSON.parse(roomInfo['positions'])
            stage = JSON.parse(roomInfo['stage'])
            slot1Locked = JSON.parse(roomInfo['slot1Locked'])
            slot2Locked = JSON.parse(roomInfo['slot2Locked'])
            p1Finished = JSON.parse(roomInfo['p1Finished'])
            p2Finished = JSON.parse(roomInfo['p2Finished'])
            gameEnds = JSON.parse(roomInfo['gameEnds'])
        }
    }

    const findUserId = (playerNumber) => {
        const userObj = _.find(positions, function (o) {
            return o.player === playerNumber
        })
        return userObj.userId
    }

    return {
        sendPositions: sendPositions,
        addStage: addStage,
        checkGameEnds: checkGameEnds,
        timerCounter1: timerCounter1,
        timerCounter2: timerCounter2
    }
}