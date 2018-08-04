const rpn = require('request-promise-native')

module.exports = (gameMeta, roomId, roomPlayers, marketKey) => {

    const start = async () => {
        const options = {
            method: 'POST',
            uri: 'http://localhost:3000/logics/' + gameMeta._id + '/start',
            body: {
                "roomId": roomId,
                "players": JSON.stringify(roomPlayers),
                "gameMeta": JSON.stringify(gameMeta),
                "market": marketKey
            },
            json: true
        }
        return await rpn(options)
    }

    const event = async () => {
        const options = {
            method: 'POST',
            uri: 'http://localhost:3000/logics/' + gameMeta._id + '/event',
            body: {
                "roomId": roomId,
                "players": JSON.stringify(roomPlayers),
                "gameMeta": JSON.stringify(gameMeta)
            },
            json: true
        }
        return await rpn(options)
    }

    return {
        start: start,
        event: event
    }
}