const Leaderboard = require('leaderboard-promise')
const redis = require('redis'),
    client = redis.createClient();
// const Score = scoreboard.Score;
// const scores = new Score();
client.on("error", function (err) {
    console.log("Error " + err);
});
const lb = new Leaderboard('otp', client)

const getLeaderboard = async () => {
    scores.rank({keys:['otp']}).run(function(err, leaderboard) {
        console.log(leaderboard);
    });
}

const addScore = async () => {
    return await lb.add('ramin', 10)
    // return await scores.index('otp', 100, 'edward');
}

module.exports = {
    getLeaderboard: getLeaderboard,
    addScore: addScore
}
