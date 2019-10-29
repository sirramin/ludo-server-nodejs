const target = 'http://localhost:3001'

const socketManager = (token) => {
  socket = io(target, {transports: ['websocket'], query: {token}})

  socket.on('errorMessage', function (byets) {
    const bufView = new Uint8Array(byets)
    const buf = new flatbuffersLib.ByteBuffer(bufView)
    const errorMessage = Mench.Text.Str.getRootAsStr(buf)
    $('#messages').append($('<li>').text(errorMessage.data()))
  })

  socket.on('profile', function (data) {
    $('#messages').append($('<li>').text(data + JSON.stringify(data.data)))
  })

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

