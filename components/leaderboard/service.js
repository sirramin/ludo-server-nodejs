const scoreboard = require('scoreboard')
const Score = scoreboard.Score;
const scores = new Score();
scoreboard.redis.createClient = () => {
    const client = redis.createClient();
    client.auth('7ds7s7sa7DFSDS213a');
    return client;
};

const getLeaderboard = () => {
    scores.leader({keys:['otp']}).run(function(err, leaderboard) {
        console.log(leaderboard);
    });
}

const addScore = () => {
    scores.index('otp', 100, 'edward');
}

return {
    getLeaderboard: getLeaderboard
}
