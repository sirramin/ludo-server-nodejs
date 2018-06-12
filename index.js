const express = require('express');
// const morgan = require('morgan');
// const path = require('path');
// const fs = require('fs');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const userRouter = require('./components/user/route')(router);
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use('/user/', userRouter);
app.listen(3000, () => console.log('app listening on port 3000!'))