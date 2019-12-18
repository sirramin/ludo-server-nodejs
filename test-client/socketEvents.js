const target = 'http://localhost:3001'

const socketManager = (token) => {
  socket = io(target, {transports: ['websocket'], query: {token}})

  socket.on('connect', () => {
    $('#socketId').text(socket.id)
  })

  socket.on('disconnect', () => {
    $('#socketId').text('')
  })

  socket.on('errorMessage', function (byets) {
    const bufView = new Uint8Array(byets)
    const buf = new flatbuffersLib.ByteBuffer(bufView)
    const object = Mench.Text.Str.getRootAsStr(buf)
    $('#messages').append($('<li>').text(object.data()))
  })

  socket.on('yourPlayerNumber', function (byets) {
    const bufView = new Uint8Array(byets)
    const buf = new flatbuffersLib.ByteBuffer(bufView)
    const object = Mench.Number.Integ.getRootAsInteg(buf)
    $('#playerNumber').text(object.data())
  })

  socket.on('positions', function (byets) {
    const bufView = new Uint8Array(byets)
    const buf = new flatbuffersLib.ByteBuffer(bufView)
    const Array = Mench.pos.Positions.getRootAsPositions(buf)
    // for (let i = 0; i <= object.dataLength() - 1; i++) {
    //   $('#messages').append($('<li>').text(object.data(i).player()))
    //   $('#messages').append($('<li>').text(object.data(i).username()))
    //   $('#messages').append($('<li>').text(object.data(i).userId()))
    // }
    let positionText = ''
    for (let i = 0; i <= Array.dataLength() - 1; i++) {
      positionText += '[' + Array.data(i).player() + ', ' + Array.data(i).username() + ', ' + Array.data(i).userId() + ']'
    }
    $('#messages').append($('<li>').text('positions: ' + positionText))
  })

  socket.on('lights', function (byets) {
    const bufView = new Uint8Array(byets)
    const buf = new flatbuffersLib.ByteBuffer(bufView)
    const object = Mench.Arrs.Arr.getRootAsArr(buf)
    for (let i = 0; i <= object.dataLength() - 1; i++) {
      $('#messages').append($('<span>').text(' lights' + object.data(i)))
    }
  })

  socket.on('firstTurn', function (byets) {
    const bufView = new Uint8Array(byets)
    const buf = new flatbuffersLib.ByteBuffer(bufView)
    const object = Mench.Number.Integ.getRootAsInteg(buf)
    $('#messages').append($('<li>').text('firstTurn: ' + object.data()))
  })

  socket.on('yourTurn', function () {
    yourTrun = true
    $('#rollDice').show()
    $('#messages').append($('<li>').text('yourTurn').css('color', 'blue'))
  })

  socket.on('changeTurn', function (byets) {
    const bufView = new Uint8Array(byets)
    const buf = new flatbuffersLib.ByteBuffer(bufView)
    const object = Mench.Number.Integ.getRootAsInteg(buf)
    $('#messages').append($('<li>').text('changeTurn: ' + object.data()))
  })

  socket.on('diceNumber', function (byets) {
    const bufView = new Uint8Array(byets)
    const buf = new flatbuffersLib.ByteBuffer(bufView)
    const object = Mench.Number.Integ.getRootAsInteg(buf)
    $('#messages').append($('<li>').text('diceNumber: ' + object.data()))
  })

  socket.on('canRollDiceAgain', function () {
    $('#messages').append($('<li>').text('canRollDiceAgain'))
  })

  socket.on('marblesCanMove', function (byets) {
    const bufView = new Uint8Array(byets)
    const buf = new flatbuffersLib.ByteBuffer(bufView)
    const object = Mench.Arrs.Arr.getRootAsArr(buf)
    let marblesCanMoveText = ''
    for (let i = 0; i <= object.dataLength() - 1; i++) {
      $('#move').append('<option value="' + object.data(i) + '">' + object.data(i) + '</option>')
      marblesCanMoveText += object.data(i) + ', '
    }
    $('#messages').append($('<li>').text('marblesCanMove: ' + marblesCanMoveText))
  })

  socket.on('marblesPosition', function (byets) {
    const bufView = new Uint8Array(byets)
    const buf = new flatbuffersLib.ByteBuffer(bufView)
    const Array = Mench.MarblesPos.MarblesPosition.getRootAsMarblesPosition(buf)
    let marblesPositionText = ''
    for (let i = 0; i <= Array.dataLength() - 1; i++) {
      marblesPositionText += '[' + Array.data(i).one() + ', ' + Array.data(i).two() + ', ' + Array.data(i).three() + ']'
    }
    $('#messages').append($('<li>').text('marblesPosition: ' + marblesPositionText))
  })

  // socket.on('friendly', function (data) {
  //   if (data === 'friendlyMatchRequest')
  //     if (confirm('you are invited by ' + data.data.inviter)) {
  //       socket.emit('joinFriendly', 1)
  //     }
  // })

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

