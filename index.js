const express = require('express');
const app = express();
const router = express.Router();
const path = require('path')
app.use('/apidoc8574636', express.static('apidoc'))
const bodyParser = require('body-parser');
const userRouter = require('./components/user/route')(router);
const testRouter = require('./components/test/route')(router);
const otpRouter = require('./components/otp/route')(router);
const leaderboardRouter = require('./components/leaderboard/route')(router);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use('/user', userRouter);
app.use('/otp', otpRouter);
app.use('/leaderboard', leaderboardRouter);
app.use('/unitTest', testRouter);

app.listen(3000, () => console.log('app listening on port 3000!'))