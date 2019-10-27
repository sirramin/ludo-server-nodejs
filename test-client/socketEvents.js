const target = 'http://localhost:3001'
// const target = 'http://192.168.43.243:3001'

const socketManager = (token) => {
  socket = io(target, {transports: ['websocket'], query: {token}})

  socket.on('message', function (msg) {
    $('#messages').append($('<li>').text(JSON.stringify(msg)))
  })

  socket.on('string', function (data) {
    $('#messages').append($('<li>').text(data))
  })

  socket.on('json', function (data) {
    $('#messages').append($('<li>').text(JSON.stringify(data)))
  })

// socket.on('profile', function (data) {
//     $('#messages').append($('<li>').text(data + JSON.stringify(data.data)))
// })

  socket.on('friendly', function (data) {
    if (data === 'friendlyMatchRequest')
      if (confirm('you are invited by ' + data.data.inviter)) {
        socket.emit('joinFriendly', 1)
      }
  })

  var yourTrun = false
  var color = 'black'

  const diceClick = () => {
    setTimeout(function () {
      if (yourTrun) {
        // $('#rollDice').click()
      }
    }, 2000)
  }

  socket.on('json', function (data) {
    if (data.hasOwnProperty('changeTurn')) {
      yourTrun = false
      color = 'black'
      $('#rollDice').hide()
      $('#move').hide()
      $('#messages').append($('<li>').text(data + ' ' + JSON.stringify(data.data)))
    } else if (data === 'yourTurn') {
      yourTrun = true
      color = 'blue'
      $('#rollDice').show()
      // diceClick()
      $('#messages').append($('<li>').text(data).css('color', color))
    } else if (data === 'marblesCanMove' && yourTrun) {
      console.log('marblesCanMove')
      console.log('yourTrun')
      $('#rollDice').hide()
      $('#move').show()
      $('#messages').append($('<li>').text(data + ' ' + data.data).css('color', color))
      const marblesArray = data.data
      // var selectedNumber = Math.floor(Math.random() * marblesArray.length) + 1;

      // console.log("my array: ", marblesArray);
      // var rand = marblesArray[Math.floor(Math.random() * marblesArray.length)];
      // console.log("picked number: ", rand);
      // setTimeout(function () {
      //     console.log("move!");
      //     socket.emit('event', JSON.stringify({
      //         act: 'move',
      //         data: {
      //             marbleNumber: rand
      //         }
      //     }))
      // }, 2000)

      marblesArray.forEach((item, index) => {

        $('#move').append('<option value="' + item + '">' + item + '</option>')

      })
    } else if (data.hasOwnProperty('yourPlayerNumber')) {
      // $('#messages').append($('<li>').text(data + ' ' + JSON.stringify(data.data)).css('color', color))
      $('#playerNumber').text(data.yourPlayerNumber)
    } else {
      // $('#messages').append($('<li>').text(data + ' ' + JSON.stringify(data.data)).css('color', color))
    }


    if (data === 'canRollDiceAgain' && yourTrun) {
      $('#rollDice').show()
      // diceClick()
    }
    if (data === 'marblesPosition' && yourTrun) {
      console.log('--------' + yourTrun + '----------')
      $('#rollDice').show()
      // diceClick()
    }
  })
}

