const _ = require('lodash');
const rpn = require('request-promise-native')

module.exports = (router) => {

    router.get('/addScore', async (req, res, next) => {
        res.send('done')

        const addUser = async () => {
            let options = {
                method: 'POST',
                uri: 'http://localhost:4000/user/signup',
                json: true
            }
            for (let i = 0; i <= 30000; i++) {
                options.body = {
                    password: 'rezapishro',
                    phoneNumber: _.random(0, 9999999),
                    username: 'sirramin' + _.random(0, 9999999)
                }
                const res = await rpn.post(options)
                addScore(res.token)
            }
        }

        const addScore = async (token) => {
            let options = {
                method: 'POST',
                uri: 'http://localhost:4000/leaderboard/gameResult',
                json: true
            }
            options.headers = {
                token: token
            }
            options.body = {
                "league": 2,
                "isWinner": true
            }
            await rpn.post(options)
        }

        await addUser()

    })

    return router
}

