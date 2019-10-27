$('#joinRoom').click(() => {
  socket.emit('joinRoom', 1)
})

$('#invite').click(() => {
  let usernamesArray = []
  $('.invite').each(function () {
    console.log($(this))
    const username = $(this).children('span').text()
    const checkbox = $(this).children('input')
    if ($(checkbox).is(':checked'))
      usernamesArray.push(username)
  })
  socket.emit('invite', usernamesArray)
})

$('#leftRoom').click(() => {
  socket.emit('leftRoom', 1)
})

$('#profile').click(() => {
  socket.emit('event', JSON.stringify({
    act: 'profile'
  }))
})

$('#rollDice').on('click', () => {
  $('#move').html('<option value="">--</option>')
  socket.emit('event', JSON.stringify({
    act: 'rollDice',
    data: {}
  }))
})


$('select').on('change', function () {
  if (this.value)
    socket.emit('event', JSON.stringify({
      act: 'move',
      data: {
        marbleNumber: this.value
      }
    }))
})