$('#joinRoom').click(() => {
  socket.emit('joinRoom')
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
  socket.emit('leftRoom')
})

// $('#profile').click(() => {
//   socket.emit('event', JSON.stringify({
//     act: 'profile'
//   }))
// })

$('#rollDice').on('click', () => {
  $('#move').html('<option value="">--</option>')
  socket.emit('rollDice')
})


$('select').on('change', function () {
  if (this.value) {
    const marbleNumber = this.value
    socket.emit('move', marbleNumber)
  }
})