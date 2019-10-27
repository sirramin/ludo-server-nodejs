$('#followings').click(async () => {
  const token = localStorage.token
  const followings = await $.ajax({
    url: target + "/friendship/followings",
    type: 'GET',
    headers: {
      token: token
    },
    dataType: 'json'
  })
  $.each(followings.data, (index, value) => {
    const invite = value.online ? '<input type="checkbox" >' : ''
    const li = '<li class="invite">' +
      '<span>' + value.middleware.username + '</span>'
      + ' - ' +
      value.online
      + invite
      + '</li>'
    $('#following-list').append(li)
  })
  $('#invite').show()
})

