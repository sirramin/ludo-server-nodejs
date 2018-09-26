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
        await methods.setProp('remainingTime1', maxTime)
        await methods.setProp('remainingTime2', maxTime)
        await getInitialProperties()
        const result = await checkCombination(combination)
        methods.sendGameEvents(20, 'result', result)
        const sd = await checkGameEnds(combination)

    }

    const checkCombination = async (combination) => {
        const common = _.intersection(correctCombination, combination)
        let displaced = 0, exact = 0
        common.forEach(async (item, index) => {
            if (correctCombination.indexOf(item) === index)
                displaced++
            else
                exact++
        })

        if (exact === 3)
            await playerFinished()

        return {
            displaced: displaced,
            exact: exact
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
        correctCombination = parseInt(roomInfo['remainingTime1'])
        remainingTime1 = parseInt(roomInfo['remainingTime1'])
        remainingTime2 = parseInt(roomInfo['remainingTime2'])
        positions = JSON.parse(roomInfo['positions'])
    }


    const checkGameEnds = (marblesPosition, newMarblesPosition) => {

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