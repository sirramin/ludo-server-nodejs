const Leaderboard = require('leaderboard-promise'),
    redisClient = require('../../common/redis-client')
_ = require('lodash')

module.exports = (dbUrl, market) => {
    const leaderboardPath = dbUrl + ':leaders:' + market,
        usersPath = dbUrl + ':users:' + market,
        lb = new Leaderboard(leaderboardPath)

    const addFakes = async () => {
        for (let i = 0; i <= sampleData.length; i++) {
            const item = sampleData[i]
            const userInfo = {
                "userId": item.userId,
                "name": item.name,
                "win": item.wins,
                "lose": item.lose
            }
            await lb.add(item.userId, item.score)
            await redisClient.hset(usersPath, item.userId, JSON.stringify(userInfo))
        }
    }

    const removeFakes = async () => {
        for (let i = 0; i <= sampleData.length; i++) {
            const userId = sampleData[i].userId
            await redisClient.zrem(leaderboardPath, userId)
            await redisClient.hdel(usersPath, userId)
        }
    }

    const sampleData = [
        {
            "userId": "5b3f0f29f044455f4b8b28b3",
            "name": "whiterose",
            "score": 93,
            "lose": 35,
            "wins": 15
        },
        {
            "userId": "5b47d5cc23b42c563787a2fd",
            "name": "user619346353810",
            "score": 89,
            "lose": 19,
            "wins": 13
        },
        {
            "userId": "5b41be404e2bed396cba3d9e",
            "name": "Leila9090",
            "score": 88,
            "lose": 30,
            "wins": 22
        },
        {
            "userId": "5b47180c4914c25734d94b7d",
            "name": "saeid",
            "score": 77,
            "lose": 21,
            "wins": 18
        },
        {
            "userId": "5b43d53bd019f139c0bef521",
            "name": "user714734444511",
            "score": 62,
            "lose": 48,
            "wins": 34
        },
        {
            "userId": "5b430b404e2bed396cba419e",
            "name": "user1234948554928",
            "score": 61,
            "lose": 9,
            "wins": 7
        },
        {
            "userId": "5b1f9bcba4f5ec0cbdc1123e",
            "name": "morteza",
            "score": 60,
            "lose": 8,
            "wins": 12
        },
        {
            "userId": "5b1e3488d12fa30cb83d4ec7",
            "name": "bobby_km",
            "score": 59,
            "lose": 6,
            "wins": 10
        },
        {
            "userId": "5b43c2d8c450a539666f0d28",
            "name": "tanhayvahshi",
            "score": 56,
            "lose": 15,
            "wins": 12
        },
        {
            "userId": "5b433764d019f139c0bef208",
            "name": "محمد",
            "score": 52,
            "lose": 23,
            "wins": 17
        },
        {
            "userId": "5b4708631b4060563439738d",
            "name": "ALIREZA 37",
            "score": 51,
            "lose": 40,
            "wins": 16
        },
        {
            "userId": "5b48628123b42c563787a4bf",
            "name": "user308436868065",
            "score": 51,
            "lose": 10,
            "wins": 13
        },
        {
            "userId": "5b4368134e2bed396cba43a4",
            "name": "user408170976149",
            "score": 48,
            "lose": 26,
            "wins": 16
        },
        {
            "userId": "5b13be3cbb481c6b7be76f51",
            "name": "AliNazario",
            "score": 45,
            "lose": 8,
            "wins": 9
        },
        {
            "userId": "5b43631d101bec396bdfe3e9",
            "name": "09361313989",
            "score": 45,
            "lose": 12,
            "wins": 10
        },
        {
            "userId": "5b4528844dc448562fe7119f",
            "name": "ایرج",
            "score": 41,
            "lose": 11,
            "wins": 8
        },
        {
            "userId": "5b4f988030d1a92cc8ab9e62",
            "name": "taha",
            "score": 38,
            "lose": 19,
            "wins": 13
        },
        {
            "userId": "5b411530101bec396bdfdd49",
            "name": "mryam",
            "score": 35,
            "lose": 11,
            "wins": 12
        },
        {
            "userId": "5b422f7ec450a539666f0686",
            "name": "Nazi ioon",
            "score": 34,
            "lose": 27,
            "wins": 24
        }
    ]

    return {
        addFakes: addFakes,
        removeFakes: removeFakes
    }
}