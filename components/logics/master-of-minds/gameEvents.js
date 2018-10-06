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
    let matchMaking, roomId, methods, roomInfo

    const getAct = async (msg) => {
        const {act, data} = msg
        if (act === 'arrange')
            await arrange(data.combination)
        if (act === 'chat')
            chat(data.msg)
    }

    const arrange = async (combination) => {
        await getInitialProperties()
        await methods.setProp('slot' + findPlayerNumber() + 'Locked', true)
        // stage = await methods.incrProp('stage', 1)
        // methods.sendGameEvents(104, 'stageIncreased', stage)
        const result = await checkCombination(combination)
        await methods.sendEventToSpecificSocket(userId, 20, 'result', result)
        await checkGameEnds(combination)
    }

    const checkCombination = async (userCombination) => {
        const common = _.intersection(correctCombination, userCombination)
        let displaced = 0, exact = 0
        common.forEach(async (item, index) => {
            if (correctCombination.indexOf(item) === userCombination.indexOf(item))
                exact++
            else
                displaced++
        })

        if (exact === 3)
            await playerFinished()

        return {
            displaced: displaced,
            exact: exact
        }
    }

    const checkGameEnds = async () => {
        const p1Finished = await methods.getProp('player1finished')
        const p2Finished = await methods.getProp('player1finished')
        if (p1Finished && p2Finished) {
            methods.sendGameEvents(24, 'gameEnd', {
                "winner": currentPlayer
            })
            await methods.deleteRoom(roomId)
        }
    }

    const playerFinished = async () => {
        await methods.setProp('player' + findPlayerNumber() + 'finished', true)
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
    }


    const findUserId = (nextPlayer) => {
        const userObj = _.find(positions, function (o) {
            return o.player === nextPlayer
        })
        return userObj.userId
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